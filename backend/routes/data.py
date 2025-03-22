from fastapi import APIRouter, HTTPException, Depends
import pandas as pd
from typing import List, Dict
from io import StringIO
from datetime import datetime, timedelta
import random
from auth.cognito import cognito_scheme

router = APIRouter(
    prefix="/data",
    tags=["data"],
    dependencies=[Depends(cognito_scheme)]  # Apply Cognito auth to all endpoints in this router
)

@router.post("/analyze")
async def analyze_data(data: List[Dict[str, float]]):
    try:
        # Convert input data to pandas DataFrame
        df = pd.DataFrame(data)
        
        # Perform some basic analysis
        analysis = {
            "mean": df.mean().to_dict(),
            "median": df.median().to_dict(),
            "std": df.std().to_dict(),
            "summary": df.describe().to_dict()
        }
        
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/sites/{site_id}/gts/{gt_id}")
async def get_groundtruth_data(site_id: str, gt_id: str):
    try:
        # Mock data for a specific ground truth measurement
        mock_data = {
            "id": gt_id,
            "site_id": site_id,
            "timestamp": datetime.now().isoformat(),
            "measurements": [
                {
                    "depth": i * 0.5,
                    "temperature": round(20 + random.uniform(-2, 2), 2),
                    "moisture": round(random.uniform(0.2, 0.4), 3),
                    "conductivity": round(random.uniform(0.1, 0.3), 3)
                } for i in range(10)
            ],
            "metadata": {
                "sensor_type": "TEROS-12",
                "calibration_date": (datetime.now() - timedelta(days=30)).isoformat(),
                "accuracy": "±0.1°C"
            }
        }
        return mock_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 
    
@router.get("/sites/{site_id}/gts")
async def get_site_groundtruths(site_id: str):
    try:
        # Mock data for all ground truth measurements at a site
        mock_gts = [
            {
                "id": f"gt_{i}",
                "site_id": site_id,
                "location": {
                    "latitude": round(34.0522 + random.uniform(-0.01, 0.01), 6),
                    "longitude": round(-118.2437 + random.uniform(-0.01, 0.01), 6)
                },
                "installation_date": (datetime.now() - timedelta(days=random.randint(1, 365))).isoformat(),
                "last_reading": datetime.now().isoformat(),
                "status": random.choice(["active", "active", "active", "maintenance"]),
                "sensor_count": random.randint(3, 8)
            } for i in range(5)
        ]
        return mock_gts
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 

@router.get("/sites")
async def get_sites():
    try:
        # Mock data for available sites
        mock_sites = [
            {
                "id": f"site_{i}",
                "name": f"Research Site {i}",
                "location": {
                    "latitude": round(34.0522 + random.uniform(-0.5, 0.5), 6),
                    "longitude": round(-118.2437 + random.uniform(-0.5, 0.5), 6),
                    "elevation": round(random.uniform(100, 1000), 2)
                },
                "metadata": {
                    "soil_type": random.choice(["Sandy Loam", "Clay", "Silt Loam", "Loamy Sand"]),
                    "vegetation": random.choice(["Forest", "Grassland", "Agricultural", "Mixed"]),
                    "climate_zone": random.choice(["Mediterranean", "Semi-arid", "Temperate"])
                },
                "active_sensors": random.randint(5, 15),
                "created_at": (datetime.now() - timedelta(days=random.randint(100, 1000))).isoformat()
            } for i in range(8)
        ]
        return mock_sites
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 