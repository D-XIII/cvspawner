"""
Tests for the scoring service.
TDD: RED phase - these tests should fail until implementation.
"""

import pytest
from unittest.mock import patch, MagicMock


class TestScoringService:
    """Tests for the scoring service module."""

    def test_prepare_cv_text_combines_all_sections(self):
        """Should combine profile, experiences, skills into a single text."""
        from scoring import prepare_cv_text

        cv_data = {
            "profile": {
                "title": "Software Engineer",
                "summary": "Experienced developer with Python expertise"
            },
            "experiences": [
                {
                    "title": "Senior Developer",
                    "company": "TechCorp",
                    "description": "Built web applications using React and Python"
                }
            ],
            "skills": [
                {"name": "Python", "category": "technical"},
                {"name": "React", "category": "technical"},
                {"name": "French", "category": "language"}
            ]
        }

        result = prepare_cv_text(cv_data)

        assert "Software Engineer" in result
        assert "Python" in result
        assert "React" in result
        assert "Senior Developer" in result
        assert "TechCorp" in result

    def test_prepare_cv_text_handles_empty_data(self):
        """Should handle empty CV data gracefully."""
        from scoring import prepare_cv_text

        cv_data = {
            "profile": None,
            "experiences": [],
            "skills": []
        }

        result = prepare_cv_text(cv_data)

        assert result == ""

    def test_prepare_cv_text_handles_missing_fields(self):
        """Should handle missing optional fields."""
        from scoring import prepare_cv_text

        cv_data = {
            "profile": {"title": "Developer"},
            "experiences": [{"title": "Dev", "company": "Corp"}],
            "skills": []
        }

        result = prepare_cv_text(cv_data)

        assert "Developer" in result
        assert "Dev" in result

    def test_prepare_job_text_combines_title_and_description(self):
        """Should combine job title, company, and description."""
        from scoring import prepare_job_text

        job = {
            "title": "React Developer",
            "company": "StartupXYZ",
            "description": "We are looking for a React developer with TypeScript experience."
        }

        result = prepare_job_text(job)

        assert "React Developer" in result
        assert "StartupXYZ" in result
        assert "TypeScript" in result

    def test_prepare_job_text_handles_missing_description(self):
        """Should work with just title and company if no description."""
        from scoring import prepare_job_text

        job = {
            "title": "Python Developer",
            "company": "DataCo",
            "description": None
        }

        result = prepare_job_text(job)

        assert "Python Developer" in result
        assert "DataCo" in result

    def test_calculate_score_returns_percentage(self):
        """Should return a score between 0 and 100."""
        from scoring import calculate_score

        cv_text = "Python developer with 5 years of experience in web development"
        job_text = "Looking for a Python developer for web applications"

        score = calculate_score(cv_text, job_text)

        assert isinstance(score, float)
        assert 0 <= score <= 100

    def test_calculate_score_high_for_similar_texts(self):
        """Should return high score for very similar texts."""
        from scoring import calculate_score

        cv_text = "Senior React Developer with TypeScript and Node.js experience"
        job_text = "Senior React Developer needed with TypeScript and Node.js skills"

        score = calculate_score(cv_text, job_text)

        assert score > 70  # Should be high similarity

    def test_calculate_score_low_for_different_texts(self):
        """Should return low score for unrelated texts."""
        from scoring import calculate_score

        cv_text = "Chef cuisinier spécialisé en cuisine française traditionnelle"
        job_text = "Quantum physicist for particle accelerator research"

        score = calculate_score(cv_text, job_text)

        assert score < 40  # Should be low similarity

    def test_calculate_score_handles_empty_cv(self):
        """Should return 0 if CV text is empty."""
        from scoring import calculate_score

        score = calculate_score("", "Some job description")

        assert score == 0

    def test_calculate_score_handles_empty_job(self):
        """Should return 0 if job text is empty."""
        from scoring import calculate_score

        score = calculate_score("Some CV content", "")

        assert score == 0

    def test_calculate_batch_scores_processes_multiple_jobs(self):
        """Should calculate scores for multiple jobs at once."""
        from scoring import calculate_batch_scores

        cv_text = "Python developer with Django and PostgreSQL experience"
        jobs = [
            {"id": "1", "text": "Python Django developer needed"},
            {"id": "2", "text": "React frontend developer position"},
            {"id": "3", "text": "Python backend engineer with SQL skills"}
        ]

        results = calculate_batch_scores(cv_text, jobs)

        assert len(results) == 3
        assert all("id" in r and "score" in r for r in results)
        # Python Django job should score higher than React job
        python_scores = [r["score"] for r in results if r["id"] in ["1", "3"]]
        react_score = next(r["score"] for r in results if r["id"] == "2")
        assert all(ps > react_score for ps in python_scores)

    def test_get_model_status_returns_loaded_state(self):
        """Should return whether model is loaded."""
        from scoring import get_model_status

        status = get_model_status()

        assert "loaded" in status
        assert "model_name" in status
        assert isinstance(status["loaded"], bool)


class TestScoringEndpoints:
    """Tests for the FastAPI scoring endpoints."""

    @pytest.fixture
    def client(self):
        """Create test client."""
        from fastapi.testclient import TestClient
        from main import app
        return TestClient(app)

    def test_health_check(self, client):
        """Health endpoint should work."""
        response = client.get("/health")
        assert response.status_code == 200

    def test_model_status_endpoint(self, client):
        """Should return model status."""
        response = client.get("/model-status")
        assert response.status_code == 200
        data = response.json()
        assert "loaded" in data
        assert "model_name" in data

    def test_score_endpoint_validates_input(self, client):
        """Should validate required fields."""
        response = client.post("/score", json={})
        assert response.status_code == 422  # Validation error

    def test_score_endpoint_calculates_score(self, client):
        """Should calculate and return score."""
        response = client.post("/score", json={
            "cv_data": {
                "profile": {"title": "Python Developer"},
                "experiences": [],
                "skills": [{"name": "Python", "category": "technical"}]
            },
            "job": {
                "title": "Python Developer",
                "company": "TechCo",
                "description": "Looking for Python developer"
            }
        })
        assert response.status_code == 200
        data = response.json()
        assert "score" in data
        assert 0 <= data["score"] <= 100

    def test_score_endpoint_handles_empty_cv(self, client):
        """Should handle empty CV gracefully."""
        response = client.post("/score", json={
            "cv_data": {
                "profile": None,
                "experiences": [],
                "skills": []
            },
            "job": {
                "title": "Developer",
                "company": "Co",
                "description": "Job"
            }
        })
        assert response.status_code == 200
        data = response.json()
        assert data["score"] == 0
        assert "error" in data or "message" in data

    def test_batch_score_endpoint(self, client):
        """Should calculate scores for multiple jobs."""
        response = client.post("/score-batch", json={
            "cv_data": {
                "profile": {"title": "Developer"},
                "experiences": [],
                "skills": [{"name": "Python", "category": "technical"}]
            },
            "jobs": [
                {"id": "job1", "title": "Python Dev", "company": "A", "description": "Python"},
                {"id": "job2", "title": "Java Dev", "company": "B", "description": "Java"}
            ]
        })
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        assert len(data["results"]) == 2
