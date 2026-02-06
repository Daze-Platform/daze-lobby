

# Daze Lobby - Control Tower Dashboard

A high-density operational dashboard for managing hotel client lifecycles with role-based access, automated alerts, and real-time device tracking.

---

## Phase 1: Foundation & Authentication

### Dark Mode Design System
- Configure Inter font as the primary typeface
- Set dark theme as default with a professional operations aesthetic
- Dense, compact spacing optimized for information display

### Role-Based Authentication
- Email/password login with Supabase Auth
- Three roles: **Admin** (full access), **Ops Manager** (manage clients), **Support** (view-only)
- Secure role management using a separate `user_roles` table

---

## Phase 2: Database Architecture

### Core Tables
- **hotels** - Client records with name, phase, contract value, assigned team member
- **hotel_contacts** - Primary and secondary contacts per hotel
- **devices** - Hardware device inventory (type, serial, status, install date)
- **activity_logs** - Timestamped action history per hotel
- **blocker_alerts** - Manual flags + automatic rule triggers

### Lifecycle Phases
1. **Onboarding** - Setup & Menu Ingestion
2. **Pilot Live** - Testing period  
3. **Contracted** - Full revenue generation

---

## Phase 3: Control Tower Dashboard

### Dense Table View
A compact data table showing all hotels at a glance:
- Hotel name, current phase, days in phase
- Blocker status (red indicator when flagged)
- Device count and their health status
- Revenue/ARR metrics
- Onboarding progress percentage
- Assigned team member
- Last activity date
- Contract value & next milestone

### Blocker Alert System
- **Manual flags**: Team marks clients as blocked with reason
- **Automatic detection**: 
  - "Stuck in phase 7+ days"
  - "No activity in 48 hours"
  - "Devices offline"
- Red badge indicators with hover details

### Quick Filters & Search
- Filter by phase, blocker status, assigned team member
- Search by hotel name or contact

---

## Phase 4: Kanban Lifecycle View

### Board Layout
Three columns representing lifecycle phases:
- **Onboarding** → **Pilot Live** → **Contracted**

### Drag-and-Drop
- Move hotel cards between phases
- Auto-log phase transitions to activity history
- Visual card showing hotel name, key metrics, and blocker status

---

## Phase 5: Client Detail Panel

### Slide-Out Drawer
Clicking any hotel opens a detailed side panel with:

**Header Section**
- Hotel name, logo, phase badge
- Quick action buttons (add note, flag as blocked)

**Contacts Tab**
- Primary and secondary contacts
- Name, role, email, phone

**Devices Tab**  
- List of installed hardware devices
- Device type, serial number, status, last check-in

**Activity Log Tab**
- Chronological feed of all actions
- Auto-logged events (phase changes, device updates)
- Manual notes from team members

**Metrics Tab**
- Contract value, ARR
- Onboarding checklist progress
- Days in current phase

---

## Summary

This plan delivers a complete operational command center with:
- ✅ High-density data visualization
- ✅ Role-based access control (Admin/Ops Manager/Support)
- ✅ Combined manual + automatic blocker alerts
- ✅ Hardware device tracking per hotel
- ✅ Full operational metrics view
- ✅ Dark mode-first design

