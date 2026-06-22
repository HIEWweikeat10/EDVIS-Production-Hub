# QA_FINAL.md — V21-Phase2-Stable

Pass/Fail checklist. Run with two devices (Device A, Device B) joined
to the same project unless noted otherwise.

---

## Dashboard

| # | Test | Pass / Fail |
|---|---|---|
| 1 | Latest Broadcast displays and syncs to both devices | |
| 2 | Pinned/Urgent broadcast shows highlighted on both devices | |
| 3 | Today's Scenes list shows correct scene status | |
| 4 | Destination Count card shows correct totals | |
| 5 | Talent Count card shows correct totals + on-set count | |
| 6 | Meal Break — Dashboard countdown card appears for the device that started it | |
| 7 | Meal Break — Dashboard countdown card appears for receiving devices | |
| 8 | Meal Break — acknowledgement popup appears on all devices, any tab | |
| 9 | Meal Break — Dismiss hides popup locally only, countdown card stays active | |
| 10 | Meal Break — Release for Everyone ends the break on all devices | |
| 11 | Meal Break — dismissed popup does not reappear until a new break starts | |
| 12 | Wrap Day — animation appears on all devices | |
| 13 | New Day — clears daily scene/talent/meal/broadcast state | |
| 14 | New Day — clears Wrap banner on all devices | |
| 15 | New Day — does NOT clear History | |
| 16 | Reset Whole Project — requires correct admin key | |
| 17 | Reset Whole Project — clears active production data | |
| 18 | Reset Whole Project — does NOT clear History | |
| 19 | Version label visible at bottom of Dashboard | |

## Scenes

| # | Test | Pass / Fail |
|---|---|---|
| 20 | Create scene — appears on both devices | |
| 21 | Edit scene — changes sync to both devices | |
| 22 | Destination dropdown shows existing destinations | |
| 23 | Create new destination — saves and appears in future dropdowns | |
| 24 | Camera Log — Log Take form stays open while filling fields | |
| 25 | Camera Log — saved take appears on both devices | |
| 26 | Camera Log — Good/KIV/NG status updates and syncs | |
| 27 | Camera Log — delete take syncs to both devices | |
| 28 | Cameras section — Save Camera persists data | |
| 29 | Cameras section — data survives page refresh | |
| 30 | Cameras section — data syncs to other devices | |

## Broadcast

| # | Test | Pass / Fail |
|---|---|---|
| 31 | Custom broadcast sends and syncs | |
| 32 | Set Signal — full overlay animation appears on all devices, any tab | |
| 33 | Safety Signal — animation appears on all devices, any tab | |
| 34 | On The Run — toggles correctly, syncs to all devices | |
| 35 | Bring Talent On Set — overlay appears on all devices | |

## Talent (T Manager)

| # | Test | Pass / Fail |
|---|---|---|
| 36 | Talent list syncs across devices | |
| 37 | Stage changes (Arrived / On Set / Wrapped) sync | |
| 38 | On Set status syncs and shows correctly on both devices | |

## Artist

| # | Test | Pass / Fail |
|---|---|---|
| 39 | Sound/Makeup/Wardrobe status toggles and syncs | |
| 40 | Status can be changed multiple times without reverting | |
| 41 | "Mic On — All" / "Mic Off — All" persists after polling | |

## Crew

| # | Test | Pass / Fail |
|---|---|---|
| 42 | Crew list shows all joined members | |
| 43 | Online/offline status updates correctly (heartbeat) | |

## Meals

| # | Test | Pass / Fail |
|---|---|---|
| 44 | Meal selection saves and syncs | |
| 45 | Meal choice can be changed multiple times | |
| 46 | Preparing/Available status toggle syncs | |

## Callsheet

| # | Test | Pass / Fail |
|---|---|---|
| 47 | Upload callsheet — succeeds | |
| 48 | Uploaded callsheet viewable after upload | |
| 49 | Uploaded callsheet appears on other devices | |
| 50 | Delete callsheet — removes from both devices, stays gone after refresh | |
| 51 | Dashboard "Today's Callsheet" syncs across devices | |

## Script

| # | Test | Pass / Fail |
|---|---|---|
| 52 | Create script scene with dialogue — saves | |
| 53 | Dialogue lines sync to other devices | |
| 54 | Link to Scene dropdown shows Scene Tab entries | |
| 55 | Linked script scene status follows the Scene Tab status automatically | |

## Reports

| # | Test | Pass | Fail |
|---|---|---|---|
| 56 | Submit report — saves and syncs | | |
| 57 | View Report opens full detail correctly after hydration | | |
| 58 | Report status can be changed and persists | | |

## History

| # | Test | Pass / Fail |
|---|---|---|
| 59 | History records appear after Wrap Day | |
| 60 | History view shows full detail correctly | |
| 61 | Delete a history entry — syncs and stays deleted after refresh | |
| 62 | History survives New Day | |
| 63 | History survives Reset Whole Project | |

---

## Sign-off

| Tested by | Date | Result |
|---|---|---|
| | | ☐ All pass — approved for production |
| | | ☐ Issues found — see notes below |

**Notes:**
