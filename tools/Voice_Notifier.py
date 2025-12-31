#!/usr/bin/env python3
"""
Voice Notifier for Vibe Coding
Version: 1.0
Date: 2024-12-29

Plays audio alerts when tasks are completed or errors occur.
Works on Windows, Mac, and Linux.
"""

import sys
import platform
import subprocess
from enum import Enum

class AlertType(Enum):
    """Types of alerts"""
    TASK_COMPLETE = "task_complete"
    TASK_START = "task_start"
    ERROR = "error"
    PROJECT_COMPLETE = "project_complete"
    BUDGET_WARNING = "budget_warning"
    HELP_NEEDED = "help_needed"

class VoiceNotifier:
    """
    Cross-platform audio notification system
    """
    
    def __init__(self):
        self.system = platform.system()
        
    def play_alert(self, alert_type: AlertType, message: str = ""):
        """
        Play an audio alert based on type
        
        Args:
            alert_type: Type of alert to play
            message: Optional message to speak (text-to-speech)
        """
        if self.system == "Windows":
            self._play_windows(alert_type, message)
        elif self.system == "Darwin":  # macOS
            self._play_mac(alert_type, message)
        elif self.system == "Linux":
            self._play_linux(alert_type, message)
        else:
            print(f"⚠️ Unsupported system: {self.system}")
    
    def _play_windows(self, alert_type: AlertType, message: str):
        """Play alert on Windows"""
        try:
            # Use winsound for beeps
            import winsound
            
            frequency_map = {
                AlertType.TASK_COMPLETE: (800, 200),    # High beep
                AlertType.TASK_START: (600, 100),       # Medium beep
                AlertType.ERROR: (300, 500),            # Low long beep
                AlertType.PROJECT_COMPLETE: (1000, 300), # Very high beep
                AlertType.BUDGET_WARNING: (400, 200),   # Medium-low beep
                AlertType.HELP_NEEDED: (500, 300)       # Medium beep
            }
            
            freq, duration = frequency_map.get(alert_type, (600, 200))
            
            # Play beep
            winsound.Beep(freq, duration)
            
            # Optional: speak message using Windows TTS
            if message:
                try:
                    import win32com.client
                    speaker = win32com.client.Dispatch("SAPI.SpVoice")
                    speaker.Speak(message)
                except:
                    # If TTS not available, just print
                    print(f"🔔 {message}")
                    
        except ImportError:
            # Fallback: console beep
            print("\a")  # System beep
            print(f"🔔 {alert_type.value}: {message}")
    
    def _play_mac(self, alert_type: AlertType, message: str):
        """Play alert on macOS"""
        sound_map = {
            AlertType.TASK_COMPLETE: "Glass",
            AlertType.TASK_START: "Tink",
            AlertType.ERROR: "Basso",
            AlertType.PROJECT_COMPLETE: "Blow",
            AlertType.BUDGET_WARNING: "Funk",
            AlertType.HELP_NEEDED: "Pop"
        }
        
        sound = sound_map.get(alert_type, "Ping")
        
        try:
            # Play system sound
            subprocess.run(
                ["afplay", f"/System/Library/Sounds/{sound}.aiff"],
                check=False,
                capture_output=True
            )
        except:
            # Fallback: console beep
            print("\a")
        
        # Speak message using macOS say command
        if message:
            try:
                subprocess.run(
                    ["say", message],
                    check=False,
                    capture_output=True
                )
            except:
                print(f"🔔 {message}")
    
    def _play_linux(self, alert_type: AlertType, message: str):
        """Play alert on Linux"""
        # Try multiple methods
        methods = [
            self._linux_paplay,
            self._linux_aplay,
            self._linux_beep,
            self._linux_console_beep
        ]
        
        for method in methods:
            try:
                method(alert_type)
                break
            except:
                continue
        
        # Speak message using espeak or festival
        if message:
            self._linux_speak(message)
    
    def _linux_paplay(self, alert_type: AlertType):
        """Try paplay (PulseAudio)"""
        sound_map = {
            AlertType.TASK_COMPLETE: "complete",
            AlertType.TASK_START: "dialog-information",
            AlertType.ERROR: "dialog-error",
            AlertType.PROJECT_COMPLETE: "complete",
            AlertType.BUDGET_WARNING: "dialog-warning",
            AlertType.HELP_NEEDED: "dialog-question"
        }
        
        sound = sound_map.get(alert_type, "message")
        subprocess.run(
            ["paplay", f"/usr/share/sounds/freedesktop/stereo/{sound}.oga"],
            check=True,
            capture_output=True
        )
    
    def _linux_aplay(self, alert_type: AlertType):
        """Try aplay (ALSA)"""
        subprocess.run(
            ["aplay", "/usr/share/sounds/alsa/Front_Center.wav"],
            check=True,
            capture_output=True
        )
    
    def _linux_beep(self, alert_type: AlertType):
        """Try beep command"""
        frequency_map = {
            AlertType.TASK_COMPLETE: "800",
            AlertType.TASK_START: "600",
            AlertType.ERROR: "300",
            AlertType.PROJECT_COMPLETE: "1000",
            AlertType.BUDGET_WARNING: "400",
            AlertType.HELP_NEEDED: "500"
        }
        
        freq = frequency_map.get(alert_type, "600")
        subprocess.run(
            ["beep", "-f", freq, "-l", "200"],
            check=True,
            capture_output=True
        )
    
    def _linux_console_beep(self, alert_type: AlertType):
        """Fallback: console beep"""
        print("\a")
    
    def _linux_speak(self, message: str):
        """Speak message on Linux"""
        # Try espeak first
        try:
            subprocess.run(
                ["espeak", message],
                check=True,
                capture_output=True
            )
            return
        except:
            pass
        
        # Try festival
        try:
            subprocess.run(
                ["festival", "--tts"],
                input=message.encode(),
                check=True,
                capture_output=True
            )
            return
        except:
            pass
        
        # Fallback: just print
        print(f"🔔 {message}")

# ============================================================================
# CLI Interface
# ============================================================================

def main():
    """Command-line interface"""
    if len(sys.argv) < 2:
        print("Usage: python Voice_Notifier.py <alert_type> [message]")
        print("\nAvailable alert types:")
        for alert in AlertType:
            print(f"  - {alert.value}")
        print("\nExample:")
        print('  python Voice_Notifier.py task_complete "Task 5 is done!"')
        sys.exit(1)
    
    alert_type_str = sys.argv[1]
    message = " ".join(sys.argv[2:]) if len(sys.argv) > 2 else ""
    
    # Find matching alert type
    alert_type = None
    for alert in AlertType:
        if alert.value == alert_type_str:
            alert_type = alert
            break
    
    if not alert_type:
        print(f"❌ Unknown alert type: {alert_type_str}")
        print("Available types:")
        for alert in AlertType:
            print(f"  - {alert.value}")
        sys.exit(1)
    
    # Play alert
    notifier = VoiceNotifier()
    notifier.play_alert(alert_type, message)
    print(f"✅ Alert played: {alert_type.value}")

# ============================================================================
# Integration Examples
# ============================================================================

"""
INTEGRATION WITH AI AGENTS:

# Python Example
from Voice_Notifier import VoiceNotifier, AlertType

notifier = VoiceNotifier()

# When task completes
notifier.play_alert(AlertType.TASK_COMPLETE, "Task 5 completed successfully")

# When error occurs
notifier.play_alert(AlertType.ERROR, "Error in task 10, please check logs")

# When project completes
notifier.play_alert(AlertType.PROJECT_COMPLETE, "All tasks completed! Project ready.")

---

BASH/SHELL EXAMPLE:

# Task complete
python Voice_Notifier.py task_complete "Task 3 is done"

# Error occurred
python Voice_Notifier.py error "Connection timeout in task 7"

# Project complete
python Voice_Notifier.py project_complete "All 18 tasks completed"

---

INTEGRATION WITH TELEGRAM NOTIFIER:

When you receive a Telegram notification, also play a sound:

# In your notification script
curl -X POST https://drconnectme.ir/vibecoding/notify.php ...
python Voice_Notifier.py task_complete "New Telegram notification"

---

REQUIREMENTS:

Windows:
- No additional packages needed (uses winsound)
- Optional: pywin32 for text-to-speech (pip install pywin32)

macOS:
- No additional packages needed (uses afplay and say)

Linux:
- Audio: paplay (PulseAudio) or aplay (ALSA) or beep
- TTS: espeak or festival (optional)
  Install: sudo apt-get install espeak
  Or: sudo apt-get install festival

---

ADVANCED USAGE:

# Custom frequency/duration (modify the code)
# In _play_windows, change frequency_map

# Custom sounds (macOS)
# Place custom .aiff files in /System/Library/Sounds/

# Custom sounds (Linux)
# Place custom .oga or .wav files and update paths

# Disable TTS but keep beeps
# Just don't pass message parameter:
notifier.play_alert(AlertType.TASK_COMPLETE)  # Only beep, no speech
"""

if __name__ == "__main__":
    main()
