# `/model` Command Design

**Date:** 2025-01-03
**Status:** Design Complete
**Priority:** High

## Overview

The `/model` command provides a quick way for users to switch AI models during a session. When a user types `/model` in the input field, a command palette appears showing available models fetched from the CLI/daemon. The selected model applies to both the current session and becomes the default for future sessions.

## Requirements

- Users type `/model` to open model selector
- Models fetched once when session starts from CLI/daemon
- Selection applies to current session + sets default for future sessions
- Show model name + provider icon/color
- On empty/error: show "Configure models in CLI" message

## Architecture

### Command Detection & Triggering
- Extends the autocomplete system (already used for file paths with `/`)
- When user types `/model`, the autocomplete system activates in "command mode"
- Unlike path autocomplete which shows suggestions above input, this shows a focused modal overlay

### Data Flow
```
1. Session starts → CLI sends available models list
2. Models stored in session state (like machineName, currentPath)
3. User types "/model" → CommandPalette activates
4. User selects model → RPC call to CLI
5. CLI updates session + user preferences
6. Mobile app receives updated state
```

### Components
- `CommandPalette` - New reusable component (like FloatingOverlay)
- `useCommandDetector` - New hook to detect `/model` trigger
- `ModelSelectorItem` - Individual model row component
- Integration into `AgentInput.tsx` alongside existing autocomplete

## Component Design

### CommandPalette Component
A modal overlay that appears when `/model` is triggered:

```typescript
interface CommandPaletteProps {
    visible: boolean;
    title: string;
    items: CommandItem[];
    selectedIndex: number;
    onSelect: (index: number) => void;
    onClose: () => void;
    maxHeight?: number;
}

interface CommandItem {
    id: string;
    label: string;  // Model name
    icon?: React.ReactNode;  // Provider icon/color
}
```

- Keyboard navigation: Arrow keys to move, Enter to select, Escape to close
- Auto-selects first item
- Smooth fade-in/slide-up animation
- Backdrop tap to close

### useCommandDetector Hook
Monitors input text for `/model` trigger:

```typescript
const useCommandDetector = (text: string, trigger: string) => {
    // Detects when user types the exact trigger string
    // Returns: { isActive: boolean, clear: () => void }
}
```

- Triggers when text equals `/model` (not contains)
- Provides `clear()` to remove `/model` from input after selection
- Works alongside existing `useActiveWord` for file path autocomplete

### ModelSelectorItem
Each model row in the palette:

```typescript
interface Model {
    id: string;        // e.g., "claude-sonnet-4-20250514"
    name: string;      // Display name
    provider: string;  // "anthropic", "openai", "google"
}

interface ModelSelectorItemProps {
    model: Model;
    isSelected: boolean;
}
```

- Provider-specific icon/color (Anthropic = orange, OpenAI = green, Google = blue)
- Highlighted selected state with radio dot
- Press feedback with haptics

## Data Flow & State Management

### Session State Extensions
Add to existing `Metadata` schema:

```typescript
// Available models fetched from CLI
availableModels?: Model[];

// Currently selected model (local only, not synced)
selectedModel?: string;
```

### RPC Operations
New sync operation for model selection:

```typescript
// In sources/sync/ops.ts
sessionSetModel: (sessionId: string, modelId: string) => Promise<void>
```

CLI handler:
1. Validates model ID is in available models list
2. Updates session configuration
3. Updates user preferences (for default)
4. Returns updated session state

### Fetch Timing
Models fetched once during session initialization, alongside existing metadata:

```typescript
// CLI sends this when session starts
{
    type: 'session_update',
    metadata: {
        flavor: 'claude',
        machineName: 'MacBook Pro',
        currentPath: '/Users/dev/project',
        availableModels: [
            { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', provider: 'anthropic' },
            { id: 'claude-opus-4-20250514', name: 'Claude Opus 4', provider: 'anthropic' },
            // ...
        ],
        selectedModel: 'claude-sonnet-4-20250514'
    }
}
```

### Storage Integration
Extend `updateSessionModel` in `sources/sync/storage.ts`:

```typescript
updateSessionModel: (sessionId: string, modelId: string) => {
    // Update local session state
    // Trigger RPC to CLI
    // Optimistic update
}
```

## User Experience Flow

### Typing `/model`
1. User types "/" → Autocomplete system activates for file paths
2. User continues typing "model" → `useCommandDetector` recognizes `/model`
3. Input field clears `/model` text (stored for restoration if canceled)
4. Command palette fades in from bottom of input

### Selecting a Model
1. First model auto-selected
2. User navigates with arrow keys (up/down) or taps directly
3. Each selection triggers haptic feedback
4. User presses Enter or taps to confirm
5. Command palette closes
6. Loading indicator shows briefly while RPC call executes
7. Success: Model badge appears in status area (like permission mode badge)
8. Error: Shake animation + toast message

### Empty/Error State
If `availableModels` is empty or fetch fails:

```
┌─────────────────────────────────┐
│ Select Model                    │
├─────────────────────────────────┤
│                                 │
│   (CPU icon)                    │
│                                 │
│   Configure models in CLI       │
│                                 │
│   See happy documentation       │
└─────────────────────────────────┘
```

### Visual Consistency
- Uses same overlay pattern as permission mode settings
- Matches typography and color scheme
- Provider icons reuse existing avatar assets
- Radio button style matches permission mode selector

## Error Handling & Edge Cases

### Network/RPC Errors
- RPC call fails: Shake animation + toast "Failed to switch model. Try again."
- Timeout after 5 seconds: Show retry button in command palette
- CLI disconnected: Fall back to "Configure models in CLI" message

### Invalid Model Selection
- User selects model that's no longer available: Refresh list + show toast
- Model ID mismatch with CLI: Re-fetch models + select first available

### State Conflicts
- Session has different model than selected: Re-sync from CLI
- User types `/model` while palette is open: Ignore (already active)
- Rapid switching: Debounce RPC calls, only send last selection

### Edge Cases
- Empty models list: Show configure message (no error)
- Single model available: Still show palette (consistency)
- Very long model names: Truncate with ellipsis, full name in tooltip
- Models with same name from different providers: Show provider icon to distinguish

### Accessibility
- Escape key always closes palette
- VoiceOver focus management on open/close
- Screen reader announces "Model selector. X models available."
- Keyboard navigation follows ARIA patterns

## Implementation Plan

### Phase 1: Core Components
1. Create `CommandPalette` component in `sources/components/`
2. Create `useCommandDetector` hook in `sources/hooks/`
3. Create `ModelSelectorItem` component
4. Add provider icon mapping utility

### Phase 2: Data Layer
1. Extend `MetadataSchema` with `availableModels` and `selectedModel`
2. Add `sessionSetModel` RPC operation to `sources/sync/ops.ts`
3. Add `updateSessionModel` to `sources/sync/storage.ts`
4. Implement CLI handler for model switching

### Phase 3: UI Integration
1. Integrate `useCommandDetector` into `AgentInput.tsx`
2. Wire up command palette state (visible/selected/onClose)
3. Add model loading/error states
4. Update status area to show selected model badge

### Phase 4: Polish
1. Add animations and transitions
2. Implement keyboard navigation
3. Add haptic feedback
4. Test error scenarios
5. Accessibility testing

### Files to Modify
- `sources/components/AgentInput.tsx` - Integrate command detector
- `sources/sync/storageTypes.ts` - Add model fields to schema
- `sources/sync/ops.ts` - Add `sessionSetModel` operation
- `sources/sync/storage.ts` - Add `updateSessionModel`
- `sources/text/translations/*.ts` - Add model-related strings

### New Files
- `sources/components/CommandPalette.tsx`
- `sources/components/ModelSelectorItem.tsx`
- `sources/hooks/useCommandDetector.ts`

## Testing Strategy

### Unit Tests
- `useCommandDetector` hook trigger detection
- `CommandPalette` keyboard navigation
- `ModelSelectorItem` rendering with different providers
- Provider icon mapping utility

### Integration Tests
- Model selection RPC call flow
- State updates after model change
- Error handling for failed RPC calls
- Empty models list display

### E2E Tests
- Type `/model` → palette opens
- Navigate models → select → verify update
- Cancel selection → input restored
- Error state → message shown
- CLI disconnect → graceful degradation

### Manual Testing Checklist
- [ ] Models load on session start
- [ ] `/model` triggers command palette
- [ ] Keyboard navigation works (arrows, enter, escape)
- [ ] Touch selection works
- [ ] Model persists after selection
- [ ] Model badge displays in status area
- [ ] Empty state shows configure message
- [ ] Error states handled gracefully
- [ ] Haptic feedback on selection
- [ ] Animations are smooth

## Success Criteria

- Users can quickly switch models during a session
- Model selection persists across sessions
- Clear visual feedback for selected model
- Graceful error handling when models unavailable
- Consistent with existing UI patterns (permission modes, agent selector)
- Accessible via keyboard and screen reader
