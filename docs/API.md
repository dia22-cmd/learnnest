# LearnNest — Technical Documentation

## Database Schema

### users
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| email | VARCHAR | Unique, not null |
| password | VARCHAR | bcrypt hashed |
| role | ENUM | 'admin' or 'parent' |
| created_at | TIMESTAMP | Auto set |
| deleted_at | TIMESTAMP | Soft delete |

### materials
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| parent_id | UUID | FK → users.id |
| title | VARCHAR | Not null |
| file_url | VARCHAR | Cloudinary URL |
| raw_text | TEXT | Extracted from PDF |
| created_at | TIMESTAMP | Auto set |

### questions
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| material_id | UUID | FK → materials.id |
| type | ENUM | 'mcq' or 'short_answer' |
| question | TEXT | Not null |
| options | JSONB | MCQ only |
| answer | TEXT | Correct answer |
| is_selected | BOOLEAN | Default false |
| created_at | TIMESTAMP | Auto set |

### submissions
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| question_id | UUID | FK → questions.id |
| child_name | VARCHAR | No login in MVP |
| answer_given | TEXT | Child's answer |
| score | INTEGER | 0–100, null until evaluated |
| feedback | TEXT | AI feedback |
| suggestions | TEXT | AI improvement tips |
| submitted_at | TIMESTAMP | Auto set |