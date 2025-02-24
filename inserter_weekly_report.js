// ==UserScript==
// @name         HackMD Weekly Timestamp Inserter
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Insert last week's Mon-Fri timestamp into HackMD editor with a shortcut.
// @author       Haoyan.Li
// @match        https://hackmd.io/*
// @grant        none
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    // --- Configuration ---
    const shortcutKey = 'ctrl+alt+w'; // Change this to your desired shortcut
    const dateFormat = '%y%m%d'; // Year, month, day format (2-digit year)

    // --- Helper Functions ---

    function getPreviousWeekRange(date) {
        const dayOfWeek = date.getDay(); // 0 (Sunday) to 6 (Saturday)
        const diff = date.getDay() - 1; // Days to subtract to get to Monday (0:Sun->-1:Sat, 1:Mon->0:Mon, 2:Tue->1:Mon, ..., 6:Sat->5:Fri)
        
        //Adjust if today is Sunday
        let daysToSubtract = diff < 0 ? 6 : diff;  // If negative, it's Sunday, so subtract 6 days to get previous Monday.

        const monday = new Date(date);
        monday.setDate(date.getDate() - daysToSubtract - 7); // Get previous Monday

        const friday = new Date(monday);
        friday.setDate(monday.getDate() + 4); // Add 4 days to get Friday

        return { monday, friday };
    }

    function strftime(format, date) {
        const year = String(date.getFullYear()).slice(-2); // Get last two digits of the year
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return format
            .replace(/%Y/g, date.getFullYear())  // Full year
            .replace(/%y/g, year) // 2-digit year
            .replace(/%m/g, month)
            .replace(/%d/g, day)
            .replace(/%H/g, hours)
            .replace(/%M/g, minutes)
            .replace(/%S/g, seconds);
    }


    function insertTimestamp() {
        const editor = document.querySelector('.CodeMirror');
        if (!editor) {
            console.error("CodeMirror editor not found.");
            return;
        }

        const cm = editor.CodeMirror;
        if (!cm) {
            console.error("CodeMirror instance not found on element.");
            return;
        }

        const today = new Date();
        const { monday, friday } = getPreviousWeekRange(today);
        const timestamp = `${strftime(dateFormat, monday)}-${strftime(dateFormat, friday)}`;

        const cursor = cm.getCursor();
        const line = cm.getLine(cursor.line);
        const newLine = line.substring(0, cursor.ch) + timestamp + line.substring(cursor.ch);

        cm.replaceRange(newLine, {line: cursor.line, ch: 0}, {line: cursor.line, ch: line.length});
        cm.setCursor({ line: cursor.line, ch: cursor.ch + timestamp.length });
        cm.focus();
    }



    // --- Event Listener ---
    function keydownHandler(event) {
      const keys = shortcutKey.toLowerCase().split('+');
      const key = keys.pop();
      const ctrlRequired = keys.includes('ctrl');
      const shiftRequired = keys.includes('shift');
      const altRequired = keys.includes('alt');
      const metaRequired = keys.includes('meta');

      if (
          event.key.toLowerCase() === key &&
          event.ctrlKey === ctrlRequired &&
          event.shiftKey === shiftRequired &&
          event.altKey === altRequired &&
          event.metaKey === metaRequired
      ) {
          event.preventDefault();
          insertTimestamp();
      }
    }


    const observer = new MutationObserver((mutations, obs) => {
        const editor = document.querySelector('.CodeMirror');
        if (editor) {
            document.addEventListener('keydown', keydownHandler);
            obs.disconnect();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

})();
