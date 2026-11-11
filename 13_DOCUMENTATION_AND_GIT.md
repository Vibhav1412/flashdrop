# Component 13: Documentation & Git/GitHub History
**PES University DBMS Level 3 Evaluation Component 13 | Max Marks: 2**

---

## 1. Overview & Verification
- **Repository Visibility**: Private during development & grading (collaborator invite provided to evaluator upon request).
- **Commit Methodology**: Strict Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `perf:`).
- **Authorship**: Granular commits reflecting individual engineering contributions:
  - **Vib**: Relational core (ER, DDL, DML, advanced SQL, procedures, triggers, RBAC).
  - **Vainik**: NoSQL atomic layer (Redis Lua, waiting room, chaos load testing).

---

## 2. Commit Log Architecture (15+ Granular Conventional Commits)

```text
* 857188a feat(phase-8): build complete next.js 14 full-stack app with dual-pool routing and storefront
* b8bf423 fix(phase-7): ensure lua script arguments use string types for universal redis compatibility
* 4903342 feat(phase-7): implement redis atomic lua holds, waiting room queue, and full RUD test suite
* a7e5d5b feat(phase-6): implement transactions lab with isolation anomalies and deadlock simulation
* fbc9998 fix(phase-5): remove explicit revokes in favor of mysql default-deny whitelist model
* b9faf95 feat(phase-5): implement native mysql 8 roles and least-privilege db users
* 457e10e feat(phase-4): implement views, indexes, functions, procedures with acid rollback, triggers, and events
* 618e063 fix(phase-2): order admin user insertion before price_history foreign key reference
* 188726b feat(phase-3): build comprehensive query library with recursive CTEs, window functions, and joins
* 829c78d feat(phase-2): write 02_seed.sql with procedural generator for 10,000+ records
* 3a9c987 feat(phase-2): write complete 01_schema.sql with 20 tables and BCNF constraints
* 23081f2 chore: normalize line endings and link evaluation files in master index
* 85465f4 docs: generate dedicated evaluation component files 01 through 14
* d82d29c docs: establish master project dump log and record phase 0
* ca22b8c chore(phase-0): scaffold project structure, docker-compose, and readme
```

---

## 3. Documentation Suite Index

| Documentation File | Topic & Target Rubric |
| :--- | :--- |
| `README.md` | Executive summary, polyglot architecture, quickstart, rubrics matrix. |
| `PROJECT_MASTER_LOG.md` | Complete unabridged engineering log containing all code and proofs. |
| `01_ER_DIAGRAM.md` | Component 1: Crow's Foot ERD, cardinalities, self-referencing relations. |
| `02_RELATIONAL_SCHEMA.md` | Component 2: 19-table schema, candidate keys, FDs, 3NF/BCNF proofs. |
| `03_SQL_DDL_IMPLEMENTATION.md` | Component 3: Storage engines, constraints, foreign key actions. |
| `04_NOSQL_DATABASE_CREATION.md`| Component 4: Redis data structures, memory limits, AOF persistence. |
| `05_TECHNOLOGY_JUSTIFICATION.md`| Component 5: Polyglot persistence, CAP theorem, ACID vs BASE. |
| `06_DML_OPERATIONS.md` | Component 6: High-volume seed architecture, batch transaction insertion. |
| `07_SQL_QUERIES.md` | Component 7: Joins, correlated subqueries, recursive CTEs, window functions. |
| `08_ADVANCED_SQL_CONCEPTS.md` | Component 8: Stored procedures, triggers, deterministic functions, views. |
| `09_NOSQL_RUD_OPERATIONS.md` | Component 9: Atomic Redis Lua scripts, full CRUD lifecycle, TTL eviction. |
| `10_NEXTJS_INTERFACE.md` | Component 10: Next.js 14 App Router, live countdowns, hold timers, SSE. |
| `11_BACKEND_API_INTEGRATION.md` | Component 11: Dual-connection pool architecture (`mysql2`) and `ioredis`. |
| `12_AUTHENTICATION_AND_RBAC.md` | Component 12: Database-enforced roles (`flashdrop_admin`, `customer`). |
| `13_DOCUMENTATION_AND_GIT.md` | Component 13: Git history, commit methodology, team distribution. |
| `14_ORIGINALITY_VIVA_CHAOS.md` | Component 14: Chaos Mode benchmark engine, live comparison, viva defense. |

---

## 4. Examiner Viva Q&A (Component 13)

**Q1: How did your team maintain clean code and commit segregation throughout development?**
> *Defense*: We used a phased git workflow following Conventional Commits. Each feature phase was developed, tested, and committed independently with descriptive messages. The commit history demonstrates genuine, iterative progression rather than a single bulk commit at the end.

