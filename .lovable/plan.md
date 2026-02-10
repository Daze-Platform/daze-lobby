

# Fix: Venue Name Input "Skewing" / Auto-completing While Typing

## Problem

When typing a venue name, the text jumps or gets auto-completed unexpectedly. This happens because of a race condition:

1. User types in the input, updating `localName` and triggering a debounced save (600ms)
2. The debounced save writes the name to the database
3. React Query refetches venue data, updating `venue.name`
4. A `useEffect` in `VenueCard` resets `localName` to match `venue.name`
5. This overwrites what the user is currently typing, causing characters to disappear or revert

## Solution

Track whether the input is actively focused. Only sync `localName` from the server value (`venue.name`) when the input is **not focused** — this prevents the server response from overwriting the user's in-progress typing.

## File Change

### `src/components/portal/VenueCard.tsx`

1. Add an `isFocused` ref to track input focus state
2. Add `onFocus` and `onBlur` handlers to the venue name `Input`
3. Guard the `useEffect` sync so it only updates `localName` when the input is not focused

```text
Before:
  useEffect(() => {
    setLocalName(venue.name);
  }, [venue.name]);

After:
  const isFocusedRef = useRef(false);

  useEffect(() => {
    if (!isFocusedRef.current) {
      setLocalName(venue.name);
    }
  }, [venue.name]);

  // Input gets onFocus/onBlur handlers:
  onFocus={() => { isFocusedRef.current = true; }}
  onBlur={() => {
    isFocusedRef.current = false;
    setLocalName(venue.name); // sync to latest server value on blur
  }}
```

This is a small, targeted fix -- no architectural changes needed.

