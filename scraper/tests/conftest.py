"""
Pytest configuration for scraper tests.
"""
import sys
from pathlib import Path

# Add the scraper directory to the path so we can import modules
scraper_dir = Path(__file__).parent.parent
sys.path.insert(0, str(scraper_dir))
