from fastapi import APIRouter, HTTPException
import pandas as pd
from typing import List, Dict
from io import StringIO

router = APIRouter(
    prefix="/data",
    tags=["data"]
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

@router.get("/sample")
async def get_sample_data():
    try:
        # Create a sample DataFrame
        df = pd.DataFrame({
            'A': [1, 2, 3, 4, 5],
            'B': [10, 20, 30, 40, 50]
        })
        
        return df.to_dict(orient='records')
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 