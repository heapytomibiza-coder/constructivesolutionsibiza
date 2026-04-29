# Changelog

All notable changes to this project will be documented here.

---

## [Unreleased]

* Ongoing improvements and fixes

---

## [Latest Version]

### Added

* Messaging route hardening (`/messages/:conversationId`)
* Route-level conversation lookup with participant validation
* Fallback handling when conversation missing from enriched list
* Smoke tests for incident route and participant mismatch

### Changed

* Conversations enrichment now degrades gracefully instead of failing
* Improved resilience of messaging UI under partial data failures

### Fixed

* Messaging crash on specific conversation routes
* False “conversation not found” states during transient failures

---

## Previous Versions

(Extract earlier entries from README here if needed — do not rewrite history)
