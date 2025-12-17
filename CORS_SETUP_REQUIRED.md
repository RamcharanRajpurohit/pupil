# IMPORTANT: CORS Configuration Required

## Action Required for pupil-agents API

Before the frontend can successfully connect to the pupil-agents API, you need to update the CORS configuration in the API server.

### File to Update
`/home/ramcharan/Documents/pmb/pupiltree-agents-develop/main.py`

### Current Configuration (Lines 42-43)
```python
# CORS Configuration
origins = ["http://localhost:8080"]  # Add your frontend origins
```

### Required Update
Replace the origins list to include your frontend URLs:

```python
# CORS Configuration
origins = [
    "http://localhost:5173",      # Vite dev server (default)
    "http://localhost:3000",      # Alternative React dev port
    "http://localhost:8080",      # Existing config
    "http://127.0.0.1:5173",      # Localhost alternative
    "http://127.0.0.1:3000",      # Localhost alternative
]
```

### For Production
When deploying to production, add your production frontend URL:

```python
origins = [
    "http://localhost:5173",
    "https://your-frontend-domain.com",  # Add your production URL
]
```

### Why This Is Necessary

CORS (Cross-Origin Resource Sharing) is a security feature that prevents websites from making requests to different domains unless explicitly allowed. Since your frontend runs on `localhost:5173` (Vite) and your API runs on `localhost:8080`, they are considered different origins.

Without updating the CORS configuration, you'll see errors in the browser console like:
```
Access to fetch at 'http://localhost:8080/api/assessments/teacher' 
from origin 'http://localhost:5173' has been blocked by CORS policy
```

### After Making Changes

1. Save the file
2. Restart the pupil-agents API server:
   ```bash
   cd pupiltree-agents-develop
   python main.py
   ```

The frontend should now be able to successfully fetch data from the API.
