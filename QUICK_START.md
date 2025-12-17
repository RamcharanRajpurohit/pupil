# Quick Start Guide - AI Tests Integration

## Step-by-Step Setup

### 1. Update CORS Configuration (REQUIRED)
First, update the pupil-agents API to allow frontend requests:

```bash
# Edit the main.py file
nano /home/ramcharan/Documents/pmb/pupiltree-agents-develop/main.py
```

Change line 42-43 from:
```python
origins = ["http://localhost:8080"]
```

To:
```python
origins = [
    "http://localhost:5173",      # Vite dev server
    "http://localhost:3000",      # Alternative port
    "http://localhost:8080",      # Existing
    "http://127.0.0.1:5173",      
]
```

### 2. Set Up Environment Variables
```bash
cd /home/ramcharan/Documents/pmb/client
cp .env.example .env
```

Edit `.env` if needed (default should work):
```env
VITE_PUPIL_AGENTS_API=http://localhost:8080
```

### 3. Start MongoDB (if not running)
```bash
# Make sure MongoDB is running for pupil-agents
sudo systemctl start mongodb
# OR
mongod
```

### 4. Start pupil-agents API
```bash
cd /home/ramcharan/Documents/pmb/pupiltree-agents-develop
python main.py
```

The API should start on `http://localhost:8080`

### 5. Start Frontend
In a new terminal:
```bash
cd /home/ramcharan/Documents/pmb/client
npm run dev
```

The frontend should start on `http://localhost:5173`

### 6. Access the Tests Page
Open your browser and go to:
```
http://localhost:5173/tests
```

## What You'll See

### Tests Overview Page (`/tests`)
- A list of all AI-generated tests
- Statistics: Total tests, Completed tests, Failed tests
- Filter buttons: All, Completed, Failed
- Each test card shows:
  - Test name and subject
  - Status (completed/failed/pending)
  - Difficulty level
  - Number of questions
  - Time and marks
  - Topics
  - "Start Test" button (for completed tests)

### Test Detail Page (`/tests/:id`)
Click "Start Test" on any completed test to:
1. See test overview (questions, time, marks, instructions)
2. Click "Start Test" to begin
3. Answer questions with full UI support:
   - MCQ (single/multiple choice)
   - Integer answers
   - Descriptive text answers
4. Navigate between questions
5. View explanations for each question
6. Submit test when done

## Troubleshooting

### "Failed to load assessments" error
- ✅ Check if pupil-agents API is running on port 8080
- ✅ Verify CORS configuration was updated
- ✅ Check browser console for specific errors
- ✅ Verify MongoDB is running with data

### No tests showing up
- ✅ Make sure you have assessments in the database
- ✅ Check API endpoint directly: `http://localhost:8080/api/assessments/teacher`
- ✅ Look at the API logs for errors

### CORS errors in browser console
- ✅ Update CORS origins in `main.py` (see Step 1)
- ✅ Restart the pupil-agents API after changes

### Tests are all "Failed"
- Failed tests have status: "failed" and null values
- This is normal - they're generation failures
- Only "completed" tests can be started
- Filter by "Completed" to see working tests

## Quick Test

After setup, test the API connection:

1. Open browser console (F12)
2. Go to `http://localhost:5173/tests`
3. Check Network tab - should see successful requests to:
   - `http://localhost:8080/api/assessments/teacher`
4. You should see test cards appear

## API Endpoints Used

```
GET http://localhost:8080/api/assessments/teacher?limit=50&offset=0
GET http://localhost:8080/api/assessments/:assessmentId
```

## File Locations

- Tests Page: `client/src/pages/TestsPage.tsx`
- Test Detail: `client/src/pages/TestDetailPage.tsx`
- API Functions: `client/src/services/api.ts`
- Types: `client/src/types/index.ts`
- Routes: `client/src/App.tsx`

## Need Help?

Check these files:
- `IMPLEMENTATION_SUMMARY.md` - Complete overview
- `AI_TESTS_README.md` - Detailed documentation
- `CORS_SETUP_REQUIRED.md` - CORS configuration help

---

That's it! You should now be able to view and take AI-generated tests. 🎉
