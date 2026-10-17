A Notion Like Workspace 
An app that you can use for reminder to save things 
📖 User Guide: How to Use the Application
1. Account Authentication
Navigate to the Register page to create a new user account.
Log in to receive your authentication token and enter your isolated workspace.
2. Workspace & Page Navigation
Click + New Page in the left sidebar to generate a blank page.
Select any page from the sidebar to open its real-time document canvas.
Page list and block trees are scoped exclusively to your user account.
3. Rich Text Editing & Block Building
Click anywhere on a blank line to start typing. Rich-text formatting (bold, italic, lists) is handled seamlessly via ProseMirror.
Hover over the left side of any block to reveal the Drag Handle (⋮⋮). Drag vertically to reorder blocks across the page layout.
4. Real-Time Collaboration & Live Cursors
Open the same page URL in two different browser windows or share the link with a collaborator.
Edits made in one window reflect instantly across all connected screens via WebSocket CRDT synchronization.
Real-time mouse cursors and active collaborator avatars appear in the top header and on the canvas.
5. Managing Relational Databases
Create Database: Select Database Block from the block creation menu.
Add Columns: Click the + icon on the table header, enter a column name, and select a property type (text, number, checkbox, date, select).
Create Options: For select columns, type custom labels to generate color-coded tags.
Switch Views: Toggle between 📋 Table View and 📊 Kanban Board View using the view selector in the upper right corner of the database block. In Board view, cards automatically group under their respective select status columns.
6. Embedded Widgets (Plugins)
Add a Plugin Block to embed interactive components (e.g., Sticky Notes, Counters).
Plugins execute inside isolated <iframe sandbox> containers and communicate state changes safely with the host workspace using window.postMessage.
7. Offline Working & Reconnection
If your internet connection drops, you can continue typing and editing blocks or database rows.
Edits are saved locally via IndexedDB. Once your connection is restored, the Yjs engine automatically reconciles and syncs offline edits back to the server.

