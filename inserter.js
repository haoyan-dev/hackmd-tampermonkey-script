// ==UserScript==
// @name         HackMD Timestamp Inserter
// @namespace    http://tampermonkey.net/
// @version      0.0.1
// @description  Insert current time into HackMD editor with a shortcut.
// @author       Haoyan.Li
// @match        https://hackmd.io/*
// @grant        none
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    // --- Configuration ---
    const shortcutKey = 'ctrl+shift+1'; // Change this to your desired shortcut
    const dateFormat = '%Y-%m-%d %H:%M:%S';  // Customize the date/time format (see strftime below)

    // --- Helper Functions ---

    // strftime implementation (basic, supports common formats)
    function strftime(format, date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return format
            .replace(/%Y/g, year)
            .replace(/%m/g, month)
            .replace(/%d/g, day)
            .replace(/%H/g, hours)
            .replace(/%M/g, minutes)
            .replace(/%S/g, seconds);
    }


    function insertTimestamp() {
      const editor = document.querySelector('.CodeMirror'); // Find the CodeMirror editor instance.
      if (!editor) {
          console.error("CodeMirror editor not found.");
          return;
      }

      // Get CodeMirror instance from the element.  Crucially important for interacting with CM.
      const cm = editor.CodeMirror;
      if (!cm) {
          console.error("CodeMirror instance not found on element.");
          return;
      }

      const now = new Date();
      const timestamp = strftime(dateFormat, now);

      // Get current cursor position
      const cursor = cm.getCursor();

      // Get the current line's content
      const line = cm.getLine(cursor.line);

       // Insert the timestamp at the cursor's position within the line
      const newLine = line.substring(0, cursor.ch) + timestamp + line.substring(cursor.ch);


      // Replace the entire line with the modified line
      cm.replaceRange(newLine, {line: cursor.line, ch: 0}, {line: cursor.line, ch: line.length});

      // Restore cursor position, accounting for inserted text.  + timestamp.length moves the cursor to the end of the timestamp.
      cm.setCursor({ line: cursor.line, ch: cursor.ch + timestamp.length });

      cm.focus(); // Keep focus on the editor.
      console.info("success to insert timestamp.")
    }



    // --- Event Listener ---
    function keydownHandler(event) {
        // Parse the shortcutKey string (e.g., "ctrl+shift+t")
        const keys = shortcutKey.toLowerCase().split('+');
        const key = keys.pop(); // The last element is the actual key
        const ctrlRequired = keys.includes('ctrl');
        const shiftRequired = keys.includes('shift');
        const altRequired = keys.includes('alt');
        const metaRequired = keys.includes('meta'); // For Cmd key on macOS

        // Check if the pressed keys match the shortcut
        if (
            event.key.toLowerCase() === key &&
            event.ctrlKey === ctrlRequired &&
            event.shiftKey === shiftRequired &&
            event.altKey === altRequired &&
            event.metaKey === metaRequired
        ) {
            event.preventDefault(); // Prevent default browser behavior
            console.info("get keydown event.")
            insertTimestamp();
        }
    }

    // Wait for the editor to be fully loaded.  MutationObserver is *much* more robust than DOMContentLoaded.
    const observer = new MutationObserver((mutations, obs) => {
        const editor = document.querySelector('.CodeMirror');
        if (editor) {
             // Add event listener for keydown
            document.addEventListener('keydown', keydownHandler);
            obs.disconnect(); // Stop observing once the editor is found.
        }
    });

     // Start observing the document body for added nodes
    observer.observe(document.body, { childList: true, subtree: true });


})();
