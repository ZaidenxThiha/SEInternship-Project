PROJECT DOCUMENT

AI ENGINEER INTERNSHIP PROGRAM

Internship Program — Position: AI Engineer  •  Duration: 3 months (12 weeks)

Final Project: TBD (to be confirmed)

Table of Contents

# 1. Objectives and Scope

TBD — To be defined once the final project is confirmed.

# 2. Functional Requirements

TBD — To be defined once the final project is confirmed.

# 3. Non-Functional Requirements

TBD — To be defined once the final project is confirmed.

# 4. High-Level Architecture

Client–Server model combined with an AI Microservice:

Client Layer: Web interface. Communicates with the Backend via a RESTful API.

Core Backend Layer: Responsible for Auth, database CRUD, and calling the AI Service.

AI Engine Layer: Receives the query from the Backend, performs Retrieval from the Vector DB, assembles the prompt, calls the LLM, then returns the result to the Backend.

This is the default reference architecture for the internship program; it will be adjusted once the final project (TBD) is confirmed.

# 5. Recommended Tech Stack (2026)

The technologies below follow current trends — easy to adopt, yet solid enough for a production environment:

Frontend

ReactJS combined with TailwindCSS.

Recommended to use a ready-made UI library (such as shadcn/ui) to save development time.

Backend

Node.js (NestJS or Express.js framework) to ensure the API handles load well, speeds up development, and keeps the language consistent (JavaScript/TypeScript) with the Frontend.

Recommended to use TypeScript to improve type-safety when working with more complex schemas (e.g., structured metadata, embeddings).

AI & Pipeline Orchestration

Python (FastAPI). Use LangGraph to manage complex RAG flows (agentic workflows) instead of standard LangChain.

Database

Relational DB: PostgreSQL.

Vector DB: use the pgvector extension installed directly on PostgreSQL to store metadata and vector embeddings in one place, reducing complexity for the intern.

LLM & Embeddings

Use the OpenAI API (GPT-4o-mini) in the early stage to keep the focus on logic.

Local/Test environment: Ollama or vLLM can be used to run open-source models (Llama 3, Qwen) to save on cost.

This is the default recommended stack for the internship program; specific choices will be revisited once the final project (TBD) is confirmed.

# 6. Database Schema Design

TBD — To be defined once the final project is confirmed.

# 7. Technical Pipeline (For AI Intern)

TBD — To be defined once the final project is confirmed.

# 8. Prompt Engineering & Guardrails

TBD — To be defined once the final project is confirmed.

# 9. MLOps / DevOps

Containerize the entire application with Docker (docker-compose covering FE, BE, AI Service, PostgreSQL).

Manage source code via Git/GitHub; interns are required to follow the Pull Request (PR) and Code Review workflow.

This is the default MLOps/DevOps setup for the internship program; specifics (e.g., CI/CD, deployment target) will be defined once the final project (TBD) is confirmed.

# 10. 3-Month (12-Week) Implementation Roadmap

Accelerated track (Principal): the roadmap is divided into two main phases: Phase 1 (Weeks 1–4, 1 month) — a condensed review of foundational technologies (Node.js, ReactJS, LLM, LangGraph) for candidates who already have a strong base, and Phase 2 (Weeks 5–12, 2 months) — implement the actual final project (TBD) in greater depth, with the last week dedicated to wrap-up and reporting.

# PHASE 1: TECHNOLOGY FOUNDATIONS (Week 1 – 4)

## Week 1 — Backend Foundations: Node.js

Content

Company onboarding; introduction to the internship program and overall objectives

Node.js core: Event Loop, Async/Await, Module system

Build a basic REST API with Express.js or NestJS

TypeScript basics: type, interface, generic

Connect to PostgreSQL using an ORM (TypeORM/Prisma)

Authentication/Authorization (JWT, role-based access)

Standardized database schema design, writing migrations

Validation, error handling, and logging in Node.js

Introduction to Docker & Docker Compose for the dev environment

Deliverable

Simple CRUD mini API (e.g., user management) using Node.js + TypeScript + PostgreSQL

Mini API with complete Auth, packaged and run via Docker Compose

## Week 2 — Frontend Foundations & Full-Stack Integration: ReactJS

Content

ReactJS core: Component, Props, State, Hooks (useState, useEffect)

Advanced state management (Context API or basic Zustand/Redux)

TailwindCSS and a UI library (e.g., shadcn/ui)

Calling APIs from the frontend (Axios/Fetch), handling loading/error states

Routing (React Router), route protection by role (Admin/User)

Connect the frontend to the backend API built in Week 1 (Auth, CRUD)

Basic responsive design (mobile-friendly)

Deliverable

Static mini Chat UI (not yet connected to AI) showing a message list, able to send sample messages

## Week 3 — AI Foundations: LLM & Basic RAG

Content

LLM concepts, basic prompt engineering

Introduction to RAG: Embedding, Vector Database, Retrieval, Generation

Hands-on: call the OpenAI API (GPT-4o-mini), write simple prompts

Set up pgvector; practice storing and querying basic vectors

Deliverable

Simple Python RAG demo script: read a text file, chunk, embed, query, and answer a basic question

## Week 4 — Advanced AI Foundations: LangGraph & Agentic Workflow

Content

Introduction to LangGraph: Node, Edge, and State concepts in agentic workflows

Comparing LangGraph with traditional LangChain

Review and consolidate 4 weeks of learning with the mentor

Deliverable

Basic RAG pipeline demo running on LangGraph (Hybrid Search/Reranking not yet integrated)

Phase 1 wrap-up review session with the mentor

# PHASE 2: REAL PROJECT IMPLEMENTATION (Week 5 – 12)

Note: the detailed content below will be adapted once the final project (TBD) is confirmed; the structure shown reflects the general shape each week is expected to follow.

## Week 5 — Project Architecture & Official Setup

Content

Apply the knowledge learned to formally design the database schema and API spec for the final project (TBD)

Set up the official repository (Git/GitHub flow, PR, code review)

Backend: set up the official Node.js project (NestJS/Express) for the project

Frontend: set up the official ReactJS project for the project

Deliverable

Official project repository, architecture documentation & API spec

## Week 6 — Backend Core Development

Content

Backend: Auth, chat/session management, and document/data management (CRUD) as applicable to the final project

Frontend: scaffold the Chat UI + Admin Dashboard shell

Deliverable

Core backend module completed (Auth, session & document management)

## Week 7 — AI Data Ingestion Pipeline

Content

AI: build the real ingestion pipeline for the project's data (parsing, chunking, embedding) — specifics TBD based on the final project's data domain

Store processed data and embeddings in the vector database

Deliverable

Ingestion pipeline running end-to-end on real project data

## Week 8 — AI Engine Integration with Backend

Content

Build the AI Service (FastAPI) using LangGraph for the RAG flow

Connect the Node.js backend with the AI Service

Deliverable

Working end-to-end chat flow demo with basic source citations

## Week 9 — Improving Retrieval Quality: Hybrid Search & Reranking

Content

Apply Hybrid Search (BM25 + Vector Similarity), if applicable to the final project

Integrate reranking (Cross-Encoder/BGE-Reranker), if applicable

Deliverable

## Week 10 — Improving Generation Quality: Guardrails & Citations

Content

Refine prompts and guardrails (anti-hallucination, prompt injection prevention)

Finalize detailed citation/source-referencing features

Deliverable

Complete generation pipeline with guardrails and detailed citations (scope TBD based on final project)

## Week 11 — Testing, Optimization & MLOps

Content

Containerize the whole system with Docker (Docker Compose: FE, BE, AI Service, PostgreSQL)

Test edge cases; measure and optimize latency (< 5 seconds)

Test robustness against hallucination/incorrect output; verify mobile responsiveness

Code cleanup and bug fixing

Deliverable

System running stably via Docker Compose; test & optimization report

## Week 12 — Documentation & Final Report

Content

Review the go-live checklist

Write API documentation (Swagger) and README.md

Prepare a wrap-up report: lessons learned, challenges, takeaways, and improvement suggestions

Prepare a final product demo slide deck

Deliverable

Complete API Docs + README.md

Wrap-up report + demo slide deck (10–15 slides)

# 11. Go-Live Checklist

The checklist below is a general template; specific items will be finalized once the final project (TBD) is confirmed.

☐  Database is properly indexed for performance (e.g., HNSW index for pgvector, if applicable to the final project).

☐  Robustness tested against edge cases / failure scenarios relevant to the final project (TBD).

☐  Interface works well on both desktop and mobile devices.

☐  API Docs (Swagger) and README.md completed for the project.
