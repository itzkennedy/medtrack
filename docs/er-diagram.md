# ER Diagram — MedTrack

## Tables & Relationships

```
┌──────────────────┐
│      USER        │
├──────────────────┤
│ PK user_id  INT  │
│    full_name     │
│    email (uniq)  │
│    password_hash │
│    role ENUM     │
│    created_at    │
└──────┬───────────┘
       │
       ├──< CAREGIVER_LINK >──┐
       │                      │
       │   ┌──────────────────┐│
       │   │ CAREGIVER_LINK   ││
       │   ├──────────────────┤│
       │   │ PK link_id  INT  ││
       │   │ FK patient_id ───┘│
       │   │ FK caregiver_id ──┘
       │   │    status ENUM    │
       │   │    created_at     │
       │   └──────────────────┘
       │
       ├──< MEDICATION
       │
       │   ┌──────────────────┐
       │   │   MEDICATION     │
       │   ├──────────────────┤
       │   │ PK medication_id │
       │   │ FK user_id       │
       │   │    name          │
       │   │    dosage        │
       │   │    start_date    │
       │   │    end_date      │
       │   │    created_at    │
       │   └──────┬───────────┘
       │          │
       │          ├──< SCHEDULE
       │          │
       │          │   ┌──────────────────┐
       │          │   │    SCHEDULE       │
       │          │   ├──────────────────┤
       │          │   │ PK schedule_id   │
       │          │   │ FK medication_id │
       │          │   │    time_of_day   │
       │          │   │    days_of_week  │
       │          │   └──────┬───────────┘
       │          │          │
       │          │          └──< ADHERENCE_LOG
       │          │
       │          │              ┌──────────────────┐
       │          │              │  ADHERENCE_LOG    │
       │          │              ├──────────────────┤
       │          │              │ PK log_id   INT  │
       │          │              │ FK schedule_id   │
       │          │              │    status ENUM   │
       │          │              │    logged_at     │
       │          │              └──────────────────┘
```

## Cardinality Summary

| Relationship | Type | Description |
|---|---|---|
| USER → MEDICATION | 1 : N | One user has many medications |
| MEDICATION → SCHEDULE | 1 : N | One medication has many time slots |
| SCHEDULE → ADHERENCE_LOG | 1 : N | One schedule has many dose records |
| USER ↔ CAREGIVER_LINK | N : M | Patient ↔ Caregiver via link table |
