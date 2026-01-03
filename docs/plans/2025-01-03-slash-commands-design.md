# Slash Commands System Design

**Date:** 2025-01-03
**Status:** Design Approved
**Related:** `/model` command implementation

## Overview

Design a comprehensive slash command system for the mobile app that supports typed commands (like `/model`) and interactive options (buttons in agent responses). The system starts with `/model` as the foundation and is extensible for future commands.

## Requirements Summary

Based on user requirements gathering:
1. **Command Types:** Slash commands (typed) + Interactive options (buttons)
2. **UI Pattern:** Command palette triggered by `/`
3. **Command Source:** Hardcoded in mobile app
4. **Execution:** RPC calls or message sending
5. **Starting Scope:** `/model` command only
6. **UX Features:** Searchable list + Inline autocomplete + Hybrid approach

---

## Section 1: Command Registry & Types

### Command Interface

```typescript
interface SlashCommand {
  id: string;                   // e.g., "model"
  trigger: string;              // e.g., "/model"
  name: string;                 // e.g., "Select Model"
  description: string;          // e.g., "Change the AI model"
  icon?: string;                // Octicons icon name
  type: 'rpc' | 'message';      // How to execute
  rpcName?: string;             // For RPC: e.g., "setModel"
  requiresSession?: boolean;    // Needs active session
  customHandler?: () => void;   // For special UI (like model selector)
}
```

### Initial Command Registry

```typescript
// sources/commands/registry.ts
import { SlashCommand } from './types';

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    id: 'model',
    trigger: '/model',
    name: 'Select Model',
    description: 'Change the AI model',
    icon: 'cpu',
    type: 'rpc',
    rpcName: 'setModel',
    requiresSession: true
  }
];

// Future commands to add:
// - /settings - Open settings
// - /help - Show help
// - /abort - Abort current operation
// - /clear - Clear conversation
// - /export - Export conversation
// - /theme - Toggle theme
// - /permissions - Change permission mode
```

### Command Type Export

```typescript
// sources/commands/types.ts
export interface SlashCommand {
  id: string;
  trigger: string;
  name: string;
  description: string;
  icon?: string;
  type: 'rpc' | 'message';
  rpcName?: string;
  requiresSession?: boolean;
  customHandler?: () => void;
}

export interface CommandExecutionContext {
  sessionId: string;
  metadata?: Metadata;
}
```

---

## Section 2: Enhanced Command Palette

### Component Structure

```
sources/components/CommandPalette/
├── CommandPalette.tsx       # Main modal component
├── CommandList.tsx          # Scrollable command list
├── CommandItem.tsx          # Individual command item
└── CommandSearchBar.tsx     # Search input field
```

### CommandPalette Component

```typescript
// sources/components/CommandPalette/CommandPalette.tsx
import React from 'react';
import { FloatingOverlay, FloatingPortal } from '@/ui';
import { StyleSheet, useStyles } from 'react-native-unistyles';
import { Octicons } from '@expo/vector-icons';
import { SLASH_COMMANDS } from '@/commands/registry';
import { CommandList } from './CommandList';
import { CommandSearchBar } from './CommandSearchBar';

interface CommandPaletteProps {
  visible: boolean;
  onSelect: (command: SlashCommand) => void;
  onClose: () => void;
  sessionId?: string;
}

export function CommandPalette({ visible, onSelect, onClose, sessionId }: CommandPaletteProps) {
  const { styles, theme } = useStyles(styles);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filteredCommands, setFilteredCommands] = React.useState(SLASH_COMMANDS);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    const filtered = SLASH_COMMANDS.filter(cmd =>
      cmd.name.toLowerCase().includes(query.toLowerCase()) ||
      cmd.trigger.toLowerCase().includes(query.toLowerCase()) ||
      cmd.description.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredCommands(filtered);
  };

  if (!visible) return null;

  return (
    <FloatingPortal>
      <FloatingOverlay onPress={onClose}>
        <View style={styles.container}>
          <View style={styles.content}>
            <CommandSearchBar
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search commands..."
            />
            <CommandList
              commands={filteredCommands}
              onSelect={onSelect}
              searchQuery={searchQuery}
            />
          </View>
        </View>
      </FloatingOverlay>
    </FloatingPortal>
  );
}

const styles = StyleSheet.create((theme, runtime) => ({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.margins.md,
  },
  content: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    overflow: 'hidden',
    maxHeight: runtime.insets.top + 400,
  },
}));
```

### CommandList Component

```typescript
// sources/components/CommandPalette/CommandList.tsx
import React from 'react';
import { ScrollView, View } from 'react-native';
import { Octicons } from '@expo/vector-icons';
import { StyleSheet, useStyles } from 'react-native-unistyles';
import { SlashCommand } from '@/commands/types';
import { CommandItem } from './CommandItem';

interface CommandListProps {
  commands: SlashCommand[];
  onSelect: (command: SlashCommand) => void;
  searchQuery?: string;
}

export function CommandList({ commands, onSelect, searchQuery = '' }: CommandListProps) {
  const { styles } = useStyles(styles);

  if (commands.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Octicons name="search" size={32} color={theme.colors.textSecondary} />
        <Text style={styles.emptyText}>No commands found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.list} bounces={false}>
      {commands.map((command) => (
        <CommandItem
          key={command.id}
          command={command}
          onPress={() => onSelect(command)}
          searchQuery={searchQuery}
        />
      ))}
    </ScrollView>
  );
}
```

### CommandItem Component

```typescript
// sources/components/CommandPalette/CommandItem.tsx
import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { Octicons } from '@expo/vector-icons';
import { StyleSheet, useStyles } from 'react-native-unistyles';
import { SlashCommand } from '@/commands/types';

interface CommandItemProps {
  command: SlashCommand;
  onPress: () => void;
  searchQuery?: string;
}

export function CommandItem({ command, onPress, searchQuery }: CommandItemProps) {
  const { styles, theme } = useStyles(styles);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Octicons name={command.icon as any} size={20} color={theme.colors.primary} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.name}>{command.name}</Text>
        <Text style={styles.trigger}>{command.trigger}</Text>
        <Text style={styles.description}>{command.description}</Text>
      </View>
    </TouchableOpacity>
  );
}
```

---

## Section 3: Inline Autocomplete System

### Autocomplete Component

```typescript
// sources/components/CommandAutocomplete.tsx
import React from 'react';
import { View, ScrollView, TouchableOpacity, Text } from 'react-native';
import { StyleSheet, useStyles } from 'react-native-unistyles';
import { Octicons } from '@expo/vector-icons';
import { SlashCommand } from '@/commands/types';

interface CommandAutocompleteProps {
  visible: boolean;
  commands: SlashCommand[];
  query: string;
  onSelect: (command: SlashCommand) => void;
}

export function CommandAutocomplete({
  visible,
  commands,
  query,
  onSelect
}: CommandAutocompleteProps) {
  const { styles, theme } = useStyles(styles);

  if (!visible || commands.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.list} bounces={false}>
        {commands.slice(0, 5).map((command) => (
          <TouchableOpacity
            key={command.id}
            style={styles.item}
            onPress={() => onSelect(command)}
          >
            <Octicons name={command.icon as any} size={16} color={theme.colors.primary} />
            <Text style={styles.trigger}>{highlightMatch(command.trigger, query)}</Text>
            <Text style={styles.name}>{command.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

function highlightMatch(text: string, query: string): string {
  // Simple implementation - full text returned
  // In production, would return formatted text with highlighted portion
  return text;
}
```

### Autocomplete Styles

```typescript
const styles = StyleSheet.create((theme) => ({
  container: {
    position: 'absolute',
    top: 60, // Below input field
    left: 0,
    right: 0,
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    maxHeight: 200,
    zIndex: 1000,
  },
  list: {
    maxHeight: 200,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  trigger: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  name: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 'auto',
  },
}));
```

---

## Section 4: Command Execution System

### Command Executor Hook

```typescript
// sources/hooks/useCommandExecutor.ts
import * as React from 'react';
import { Modal } from '@/modal';
import { sessionRPC } from '@/sync/ops';
import { SlashCommand } from '@/commands/types';

export function useCommandExecutor(sessionId: string) {
  const [isExecuting, setIsExecuting] = React.useState(false);

  const executeCommand = React.useCallback(
    async (command: SlashCommand, params?: any) => {
      if (command.requiresSession && !sessionId) {
        Modal.alert(
          'Error',
          'Please start a session first',
          [{ text: 'OK', style: 'cancel' }]
        );
        return;
      }

      setIsExecuting(true);

      try {
        if (command.type === 'rpc') {
          const result = await sessionRPC(sessionId, command.rpcName!, params);
          if (!result.success) {
            Modal.alert(
              'Error',
              result.message || 'Command failed',
              [{ text: 'OK', style: 'cancel' }]
            );
          }
        } else if (command.type === 'message') {
          // Send as message - to be implemented
          // await sendMessage(command.trigger);
        }
      } catch (error) {
        Modal.alert(
          'Error',
          error instanceof Error ? error.message : 'Command failed',
          [{ text: 'OK', style: 'cancel' }]
        );
      } finally {
        setIsExecuting(false);
      }
    },
    [sessionId]
  );

  return { executeCommand, isExecuting };
}
```

### Generic RPC Function

```typescript
// sources/sync/ops.ts - Add generic RPC helper
export async function sessionRPC<T = any>(
  sessionId: string,
  method: string,
  params?: any
): Promise<{ success: boolean; result?: T; message?: string }> {
  try {
    const apiSocket = getApiSyncSocket();
    if (!apiSocket) {
      return { success: false, message: 'Not connected to session' };
    }

    const response = await apiSocket.sessionRPC<{ success: boolean; result?: T; message?: string }, any>(
      sessionId,
      method,
      params || {}
    );

    return response;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'RPC call failed'
    };
  }
}
```

---

## Section 5: Integration with AgentInput

### AgentInput State Management

```typescript
// sources/components/AgentInput.tsx
import React from 'react';
import { useCommandDetector } from '@/hooks/useCommandDetector';
import { useCommandExecutor } from '@/hooks/useCommandExecutor';
import { CommandPalette } from '@/components/CommandPalette/CommandPalette';
import { CommandAutocomplete } from '@/components/CommandAutocomplete';
import { SLASH_COMMANDS } from '@/commands/registry';

// ... existing imports

export function AgentInput(props: AgentInputProps) {
  // ... existing state

  // Command system state
  const [showCommandPalette, setShowCommandPalette] = React.useState(false);
  const [showAutocomplete, setShowAutocomplete] = React.useState(false);
  const [filteredCommands, setFilteredCommands] = React.useState(SLASH_COMMANDS);

  const { executeCommand, isExecuting } = useCommandExecutor(props.sessionId || '');

  // Detect command triggers
  React.useEffect(() => {
    const trimmed = props.value.trim();

    if (trimmed === '/') {
      // Show full command palette
      setShowCommandPalette(true);
      setShowAutocomplete(false);
      setFilteredCommands(SLASH_COMMANDS);
    } else if (trimmed.startsWith('/')) {
      // Filter for autocomplete
      const matches = SLASH_COMMANDS.filter(cmd =>
        cmd.trigger.startsWith(trimmed)
      );
      setShowCommandPalette(false);
      setShowAutocomplete(matches.length > 0);
      setFilteredCommands(matches);
    } else {
      // Hide both
      setShowCommandPalette(false);
      setShowAutocomplete(false);
      setFilteredCommands([]);
    }
  }, [props.value]);

  const handleCommandSelect = React.useCallback(
    async (command: SlashCommand) => {
      // Special handler for model command (uses existing modal)
      if (command.id === 'model') {
        setShowCommandPalette(false);
        setShowAutocomplete(false);
        // ModelSelectorModal will handle this via useCommandDetector
        return;
      }

      // Execute command
      await executeCommand(command);

      // Clear input and hide UI
      props.onChangeText('');
      setShowCommandPalette(false);
      setShowAutocomplete(false);
    },
    [executeCommand, props]
  );

  return (
    <View style={styles.container}>
      {/* Existing input */}
      <MultiTextInput
        value={props.value}
        onChange={props.onChangeText}
        editable={!isExecuting}
        {...props}
      />

      {/* Inline autocomplete */}
      <CommandAutocomplete
        visible={showAutocomplete}
        commands={filteredCommands}
        query={props.value}
        onSelect={handleCommandSelect}
      />

      {/* Command palette */}
      <CommandPalette
        visible={showCommandPalette}
        commands={SLASH_COMMANDS}
        onSelect={handleCommandSelect}
        onClose={() => {
          setShowCommandPalette(false);
          setShowAutocomplete(false);
        }}
        sessionId={props.sessionId}
      />

      {/* Existing model selector modal */}
      <ModelSelectorModal
        visible={isModelCommandActive}
        models={availableModels}
        selectedModelId={selectedModelId}
        onSelect={handleModelSelect}
        onClose={handleModelPaletteClose}
        isLoading={isSettingModel}
      />
    </View>
  );
}
```

---

## Data Flow Summary

### User Flow for Command Palette

```
1. User types "/" in input field
   ↓
2. AgentInput detects "/" trigger
   ↓
3. CommandPalette opens with all commands
   ↓
4. User types in search bar
   ↓
5. Command list filters in real-time
   ↓
6. User taps command
   ↓
7. If command.id === 'model':
   - Close palette
   - ModelSelectorModal handles it
   Otherwise:
   - Execute command via RPC or message
   - Clear input
   - Close palette
```

### User Flow for Autocomplete

```
1. User types "/m" in input field
   ↓
2. AgentInput detects partial match
   ↓
3. Autocomplete dropdown appears below input
   ↓
4. Shows matching commands (e.g., "/model")
   ↓
5. User taps suggestion or keeps typing
   ↓
6. If tapped: complete command, execute, clear input
   If typing: continue filtering
```

### Command Execution Flow

```
Command selected
   ↓
Check requiresSession
   ↓ (if yes)
Session exists?
   ↓ (no)
Show error modal
   ↓ (yes)
Check command.type
   ↓
├─ "rpc": Call sessionRPC()
│  ├─ Success: Clear input, close UI
│  └─ Error: Show error modal
│
└─ "message": Send as user message
   └─ Agent processes and responds
```

---

## Future Extensibility

### Adding New Commands

```typescript
// 1. Add to registry
export const SLASH_COMMANDS: SlashCommand[] = [
  {
    id: 'settings',
    trigger: '/settings',
    name: 'Settings',
    description: 'Open app settings',
    icon: 'gear',
    type: 'message',  // Navigate to settings screen
    requiresSession: false
  },
  // ... existing commands
];

// 2. Add custom handler if needed (for navigation, special UI)
const handleCommandSelect = (command: SlashCommand) => {
  if (command.customHandler) {
    command.customHandler();
  } else {
    executeCommand(command);
  }
};
```

### Interactive Options (Buttons in Responses)

When OpenCode sends responses with `<options>` XML:

```typescript
// Parse options from agent message
const { options } = parseOptionsFromText(message);

// Display as buttons
{options.map((option) => (
  <TouchableOpacity onPress={() => sendMessage(option)}>
    <Text>{option}</Text>
  </TouchableOpacity>
))}
```

---

## File Structure

```
sources/
├── commands/
│   ├── registry.ts          # Command definitions
│   └── types.ts             # Command interfaces
├── components/
│   ├── CommandPalette/
│   │   ├── CommandPalette.tsx
│   │   ├── CommandList.tsx
│   │   ├── CommandItem.tsx
│   │   └── CommandSearchBar.tsx
│   ├── CommandAutocomplete.tsx
│   ├── AgentInput.tsx       # Enhanced with command support
│   └── ModelSelectorModal.tsx  # Existing, unchanged
└── hooks/
    ├── useCommandDetector.ts    # Existing
    └── useCommandExecutor.ts    # New
```

---

## Implementation Phases

### Phase 1: Foundation (Current Scope)
- [x] `/model` command with ModelSelectorModal
- [ ] Command registry with types
- [ ] CommandPalette component (searchable list)
- [ ] CommandAutocomplete component
- [ ] Integration with AgentInput
- [ ] useCommandExecutor hook

### Phase 2: Additional Commands
- [ ] `/settings` - Navigate to settings
- [ ] `/help` - Show help text
- [ ] `/abort` - Abort current operation
- [ ] `/clear` - Clear conversation

### Phase 3: Interactive Options
- [ ] Parse `<options>` from OpenCode responses
- [ ] Display as button components
- [ ] Handle button taps as message sends

### Phase 4: Advanced Features
- [ ] Keyboard navigation (web)
- [ ] Command aliases
- [ ] User-defined commands
- [ ] Command history
