from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
import subprocess
import json
import os

app = FastAPI()

import os

@app.post("/pdf")
async def generate_pdf(content: str):
    """
    Generates a PDF from content received from the frontend.

    Args:
        content (str): The content to be converted to PDF.

    Returns:
        FileResponse: A FileResponse containing the generated PDF file.

    Raises:
        HTTPException: If the PDF generation fails.
    """
    try:
        # Convert the content to bytes
        content_bytes = content.encode('utf-8')

        # Save the content to a file
        with open("output.html", "wb") as f:
            f.write(content_bytes)

        # Generate the PDF using wkhtmltopdf
        command = [
            "wkhtmltopdf",
            "output.html",
            "output.pdf"
        ]

        # Execute the command
        process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        stdout, stderr = process.communicate()

        # Check for errors
        if process.returncode != 0:
            raise HTTPException(status_code=500, detail=f"PDF generation failed: {stderr.decode()}")

        # Return the PDF file
        return FileResponse("output.pdf", media_type="application/pdf", filename="output.pdf")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Clean up temporary files
        if os.path.exists("output.html"):
            os.remove("output.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
