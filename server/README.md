# Bridge Forms Backend

Quick Express + PostgreSQL backend to store Form 1, 2, 3 submissions.

## Setup
1. Create database (example):
   - Connection: `postgres://postgres:postgres@localhost:5432/bridge_forms`
   - Create DB: `CREATE DATABASE bridge_forms;`
2. Copy env:
   - Create `.env` in `server/` with:
```
PORT=4000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/bridge_forms
```
3. Install and run:
```
cd server
npm i
npm run start
```

Server runs at http://localhost:4000 and initializes schema automatically.

## API
- POST `/api/forms`
  - body: `{ assessment_id?, form_type: 'form1'|'form2'|'form3', action_type: 'save'|'next', ...payload }`
  - returns: `{ status: 'success', assessment_id, submission_id }`

- POST `/api/assessments/:assessmentId/finalize`
  - returns: `{ status: 'success' }`



