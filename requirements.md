# requirements.md

## Project Title
University HRMIS – Recruitment and Employee Records System

---

## Overview
This system manages:
- job openings
- applicant tracking
- hiring workflow
- employee records

It is designed for universities handling faculty and staff recruitment.

---

## Core Workflow
Applicant → Review → Hiring → Employee Record

---

## Users

### Super Admin
Full access

### HR Admin
Manage applications, employees, jobs

### Department Admin
Limited visibility

---

## MVP FEATURES

---

## 1. Authentication
- Supabase Auth
- login/logout
- protected routes

---

## 2. Departments
- create
- update
- list

---

## 3. Job Openings
Fields:
- id
- job_title
- department_id
- role_type
- employment_type
- description
- qualifications
- status
- created_at

---

## 4. Applicants
Fields:
- id
- first_name
- last_name
- email
- phone
- address

---

## 5. Applications (MAIN FEATURE)
Fields:
- id
- applicant_id
- job_opening_id
- status
- submitted_at
- updated_at

---

## 6. Application Documents
- resume
- diploma
- TOR
- certificates

---

## 7. Application Notes
- hr notes
- decisions

---

## 8. Status History
Track every status change

---

## 9. Convert to Employee
- create employee record
- map fields from applicant
- allow editing

---

## 10. Employees
Fields:
- id
- employee_code
- name
- email
- role_type
- department
- employment_type
- hire_date
- active

---

## 11. Faculty Profile
- rank
- specialization
- tenure

---

## 12. Staff Profile
- category
- office_assignment

---

## 13. Employee Documents
Same pattern as application docs

---

## 14. Dashboard
Show:
- application count
- status breakdown
- employees count
- job openings

---

## NON-FUNCTIONAL

### Security
- RLS required
- no public sensitive data

### Performance
- indexed queries
- responsive UI

### Maintainability
- clean code
- modular structure

### Scalability
- normalized schema
- ready for future modules

---

## ACCEPTANCE

- user can apply
- HR can review applications
- HR can update status
- HR can convert applicant to employee
- HR can manage employees
- system runs locally