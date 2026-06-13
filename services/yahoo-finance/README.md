# Yahoo Finance Archival Module

## Overview
This directory serves as a standalone archival repository for the legacy Yahoo Finance API integration logic.

## Reason for Archival
The Portfolio Tracker application has been decoupled from Yahoo Finance to ensure reliability and performance. The primary market data and reconciliation pipelines now rely strictly on institutional Google Sheets API Edge execution infrastructure.

## Contents
- `find-ticker.ts`: Legacy stock metadata and real-time price fetching.
- `sync-assets.ts`: Legacy batch synchronization logic.

## Usage
These files are preserved for authoritative reference only and should not be imported by the production application.
