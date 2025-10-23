# 🎬 Complete Video Recording Guide for RouteWise AI

## 🎯 Video Goal
Create a 3-5 minute demo that showcases Auth0 for AI Agents solving real problems.

---

## 🛠️ Tools You'll Need (All Free!)

### Option 1: OBS Studio (Recommended - Professional Quality)
- **Download**: https://obsproject.com/
- **Free**: Yes
- **Quality**: Excellent
- **Features**: Screen + webcam, annotations, transitions

### Option 2: Windows Game Bar (Quick & Easy)
- **How to Access**: Press `Win + G`
- **Free**: Built into Windows 10/11
- **Quality**: Good
- **Features**: Quick screen recording

### Option 3: Loom (Easy with Auto-Captions)
- **Website**: https://www.loom.com/
- **Free Tier**: Up to 5 min videos
- **Quality**: Good
- **Features**: Auto-captions, easy sharing

### For Audio
- Built-in microphone (laptop/webcam)
- Or: External USB microphone ($20-50 on Amazon)

### For Editing (Optional)
- **DaVinci Resolve** (Free): https://www.blackmagicdesign.com/products/davinciresolve
- **Shotcut** (Free): https://shotcut.org/
- **Windows Video Editor** (Built-in)

---

## 📋 Pre-Recording Checklist

### 1. Prepare Your Environment
```bash
# Make sure demo works
cd C:\projects\sample\routewise-ai
npm run demo

# Test output looks good
# Should show agents executing successfully
```

### 2. Clean Up Your Desktop
- [ ] Close unnecessary applications
- [ ] Hide desktop icons (right-click desktop → View → Show desktop icons)
- [ ] Close browser tabs except Auth0 dashboard
- [ ] Set nice wallpaper (optional but professional)

### 3. Prepare Browser Tabs
Open these tabs in order:
1. Auth0 Dashboard (https://manage.auth0.com)
2. Your deployed demo (Vercel URL) - optional
3. GitHub repo - optional

### 4. Prepare Code Editor
- [ ] Open VS Code with your project
- [ ] Have these files visible:
  - `lib/auth0.ts` (show permission checking)
  - `agents/RidePreparationAgent.ts` (show agent logic)
  - `scripts/demo.ts` (run this during demo)

### 5. Test Your Audio
- [ ] Record 10 seconds, play back
- [ ] Check volume levels
- [ ] Minimize background noise (close windows, turn off fans)

---

## 🎬 Complete Video Script (4 minutes)

### **ACT 1: Hook & Problem (30 seconds)**

**[Screen: Your face or title slide]**

**You say:**
> "Hi! I'm [Your Name], and this is RouteWise AI - a rideshare platform that uses AI agents to personalize every ride while putting passengers in complete control of their data.
>
> We've all had bad rideshare experiences - wrong music, uncomfortable temperature, chatty driver when you want quiet. But the solution isn't AI surveillance - it's AI with guardrails. That's where Auth0 comes in."

**Visual:** Show title slide or your face, then transition to demo

---

### **ACT 2: The Solution Overview (30 seconds)**

**[Screen: Architecture diagram or VS Code with project open]**

**You say:**
> "RouteWise uses four autonomous AI agents secured by Auth0. Passengers set preferences - music, temperature, conversation style - and control exactly what drivers can see. Auth0 enforces these boundaries automatically."

**Visual:** Show project structure in VS Code

```
routewise-ai/
├── agents/          ← 4 AI agents
├── lib/auth0.ts     ← Auth0 integration
├── lib/tokenVault.ts ← Secure API access
└── services/        ← External APIs
```

---

### **ACT 3: Auth0 Dashboard Tour (45 seconds)**

**[Screen: Auth0 Dashboard]**

**You say:**
> "Let me show you how Auth0 powers this. Here's my Auth0 dashboard.
>
> [Navigate to Applications]
> I have two applications - one for users, and one Machine-to-Machine app for AI agents. Each agent authenticates with its own M2M token.
>
> [Navigate to APIs]
> My Token Vault securely stores OAuth tokens for Spotify, Google Maps, and other services. No credentials in my code.
>
> [Navigate to Logs or show user profile]
> And every single data access is logged here for complete compliance."

**Visual:** Click through Auth0 dashboard showing:
- Applications (Regular + M2M)
- APIs & Token Vault
- Logs/Audit trail

---

### **ACT 4: Live Demo - Permission Differences (90 seconds)**

**[Screen: Split between terminal and code]**

**You say:**
> "Now let's see it in action. I'll run our demo script that simulates a ride.
>
> [Run: npm run demo]
> 
> Watch what happens: Driver Sarah accepts a ride from passenger John.
>
> [Point to output]
> The Ride Preparation Agent activates. First, it authenticates with Auth0 - there's the M2M token.
>
> Next, it checks permissions. John has shared his music and route preferences, but NOT conversation or climate. See the output - 'Access granted to music and route, Access denied to conversation and climate.'
>
> [Point to Spotify output]
> Because John shared music, the agent uses Token Vault to access his Spotify - there's the playlist fetch. No credentials exposed.
>
> [Point to AI output]
> The agent calls OpenAI to generate personalized tips for Sarah. But notice - the AI only gets the data John consented to share. Privacy boundaries enforced.
>
> [Show final output]
> Result: Sarah gets helpful tips about music and routes, but the agent never mentions conversation style because John didn't share it."

**Visual:** Terminal showing:
```
🤖 RIDE PREPARATION AGENT ACTIVATED
✓ Agent authenticated with Auth0
✓ Permissions checked
   ✓ Granted: music, route
   ✗ Denied: conversation, climate
✓ Fetched Spotify playlists via Token Vault
✓ AI insights generated (respecting boundaries)
✅ Ride prepared successfully
```

---

### **ACT 5: Different Driver = Different Access (45 seconds)**

**[Screen: Still on terminal or show code]**

**You say:**
> "Now here's the powerful part. Let's say a different driver - Mike, who's new with only 4.2 stars - accepts this ride.
>
> [Show code or explain]
> Same passenger, same preferences, but Auth0 checks Mike's verification level. Since he's not verified, Auth0 automatically blocks sensitive data.
>
> [Show output or explain expected behavior]
> Mike only sees basic route info. Everything else is locked until he proves himself with more rides and higher ratings.
>
> No manual configuration needed - Auth0 enforces this automatically based on rules I defined once."

**Visual:** Show consent checking code:
```typescript
// From lib/auth0.ts
if (consent.share_with === 'verified_only' && driverLevel === 'new') {
  return { allowed: false, reason: 'Driver not verified' };
}
```

---

### **ACT 6: Emergency Override (40 seconds)**

**[Screen: Terminal or code showing emergency handling]**

**You say:**
> "Finally, the safety feature. If a passenger presses the panic button, the Safety Monitoring Agent immediately escalates.
>
> [Show code or explain]
> Normally, emergency contacts are completely locked. But in an emergency, Auth0 grants a special override token with justification.
>
> [Point to audit log or code]
> The agent accesses the emergency contact, alerts 911, and notifies support. And critically - every single action is logged in Auth0's audit trail.
>
> This is how AI can be both powerful AND accountable."

**Visual:** Show emergency override code:
```typescript
// Emergency token with justification
const emergencyToken = await auth0.getEmergencyToken({
  scopes: ['override:all'],
  justification: 'User safety emergency'
});

// Access normally-restricted data
const emergencyContact = await getEmergencyContact();

// Everything logged
await auth0.createAuditLog({
  action: 'emergency_override',
  justification: 'Panic button pressed'
});
```

---

### **ACT 7: Closing & Impact (30 seconds)**

**[Screen: Back to your face or summary slide]**

**You say:**
> "So that's RouteWise AI - four autonomous agents, complete Auth0 integration, and zero privacy violations.
>
> Auth0 for AI Agents made this possible with:
> - M2M authentication for agents
> - Token Vault for secure API access
> - Fine-grained authorization rules
> - And complete audit trails
>
> The future of AI isn't surveillance - it's empowerment with guardrails. And Auth0 provides those guardrails.
>
> Thanks for watching! Links to the live demo and code are in the description."

**Visual:** Show summary stats:
- 4 Autonomous AI Agents ✅
- 100% Auth0 Protected ✅
- 0 Credentials in Code ✅
- Complete Audit Trail ✅

---

## 🎥 Recording Steps

### Using OBS Studio

1. **Setup OBS**
```
1. Download and install OBS
2. Open OBS
3. Click "Settings"
4. Video: Set resolution to 1920x1080
5. Output: Set recording quality to "High Quality"
6. Audio: Select your microphone
```

2. **Create Scenes**
```
Scene 1: "Intro" - Webcam (optional) or title slide
Scene 2: "Code" - VS Code full screen
Scene 3: "Browser" - Browser with Auth0 dashboard
Scene 4: "Terminal" - Terminal running demo
Scene 5: "Split" - VS Code + Terminal side-by-side
```

3. **Add Sources**
```
- Display Capture (for full screen)
- Window Capture (for specific app)
- Image (for title slide)
- Video Capture Device (for webcam - optional)
```

4. **Record**
```
1. Press "Start Recording"
2. Follow your script
3. Press "Stop Recording"
4. Find video in: Videos folder
```

### Using Windows Game Bar (Easiest)

1. **Start Recording**
```
1. Open your terminal/VS Code
2. Press Win + G
3. Click the Record button (circle)
4. Or press Win + Alt + R
```

2. **Record Your Demo**
```
- Follow your script
- Switch between apps as needed
- Speak clearly
```

3. **Stop Recording**
```
1. Press Win + G again
2. Click Stop
3. Or press Win + Alt + R
4. Find video in: Videos/Captures folder
```

---

## 🎤 Audio Recording Tips

### Before Recording
- [ ] Close windows (reduce outside noise)
- [ ] Turn off fans/AC if possible
- [ ] Put phone on silent
- [ ] Warn family members you're recording

### Microphone Setup
- Position 6-8 inches from your mouth
- Slightly off to the side (not directly in front)
- Test audio levels before full recording

### Speaking Tips
- **Pace**: Speak slightly slower than normal
- **Energy**: Be enthusiastic (smile while talking!)
- **Clarity**: Enunciate clearly
- **Pauses**: Pause between sections (easier to edit)
- **Mistakes**: Don't stop! Just pause, re-do the sentence

---

## 📸 What to Show On Screen

### Terminal Output (Important!)
```
Make sure terminal shows:
✓ Agent authentication
✓ Permission checking (granted vs denied)
✓ API calls via Token Vault
✓ AI insights generation
✓ Action execution
✓ Audit logging
```

### Code Snippets (Quick glimpses)
```
Show these files briefly:
- lib/auth0.ts → checkPermissions function
- lib/tokenVault.ts → getToken function
- agents/RidePreparationAgent.ts → execute function
```

### Auth0 Dashboard
```
Show:
- Applications page (Regular + M2M apps)
- APIs page (your API + Token Vault)
- Logs page (recent authentications)
- User profile (with consent settings)
```

---

## ✂️ Simple Editing (Optional)

### If you make a mistake:
1. **Don't stop recording!**
2. Pause for 3 seconds
3. Repeat the sentence
4. Continue

### In editing:
1. Cut out the mistake section
2. Add simple transitions between cuts
3. Add text overlays for key points (optional)

### Text Overlays to Add:
- "4 Autonomous AI Agents"
- "100% Auth0 Protected"
- "Zero Credentials in Code"
- "Complete Audit Trail"

---

## 🎬 Recording Workflow

### Take 1: Dry Run (No recording)
- [ ] Run through script
- [ ] Practice transitions
- [ ] Time yourself (aim for 4 minutes)

### Take 2: First Recording
- [ ] Record full video
- [ ] Don't worry about perfection
- [ ] Get comfortable with flow

### Take 3: Final Recording
- [ ] Record again (you'll do better!)
- [ ] This is your submission video

**Pro Tip**: Your second or third take is usually best. First take = nervous, fourth take = tired.

---

## 📤 Exporting & Uploading

### Export Settings
```
Format: MP4
Resolution: 1920x1080 (1080p)
Frame Rate: 30fps
Bitrate: 5-10 Mbps
Audio: AAC, 128-192 kbps
```

### Where to Upload
1. **YouTube** (Unlisted or Public)
   - Best for embedding
   - Automatic captions
   - Free hosting

2. **Loom**
   - Very easy
   - Auto-captions
   - Direct share links

3. **Vimeo**
   - Professional look
   - Clean player
   - Free tier available

### Get the Link
- Upload your video
- Copy the share link
- Add to your DEV.to post

---

## ✅ Video Quality Checklist

Before submitting:
- [ ] Audio is clear (no static/background noise)
- [ ] Screen is readable (text not too small)
- [ ] Demo runs smoothly (no errors visible)
- [ ] All key points covered
- [ ] Under 5 minutes
- [ ] Shows Auth0 dashboard
- [ ] Shows code briefly
- [ ] Shows terminal output clearly
- [ ] Explains the value (not just features)

---

## 🎯 What Makes a Winning Video

### ✅ DO:
- Show genuine enthusiasm
- Explain WHY (not just what)
- Demonstrate real Auth0 features
- Show before/after (new driver vs verified)
- Keep it concise
- Use real output (not mocked)

### ❌ DON'T:
- Read from script robotically
- Show errors/bugs
- Go over 5 minutes
- Forget to show Auth0 dashboard
- Just show code (show it working!)
- Speak in monotone

---

## 💡 Quick Win Alternative: Loom

If you're short on time, use Loom:

1. Go to https://www.loom.com/
2. Sign up (free)
3. Click "Record"
4. Select "Screen + Cam" or "Screen only"
5. Click "Start Recording"
6. Follow your script
7. Click "Finish"
8. Copy the link - done!

**Advantages**:
- Super easy
- Auto-captions
- Can trim mistakes
- Instant share link

---

## 🎬 Example Timeline (4-minute video)

```
0:00 - 0:30: Hook & Problem
0:30 - 1:00: Solution Overview
1:00 - 1:45: Auth0 Dashboard Tour
1:45 - 3:15: Live Demo (Main section)
3:15 - 3:55: Emergency Override
3:55 - 4:00: Closing & Call-to-action
```

---

## 📝 Video Description Template

```
RouteWise AI - Privacy-First Ridesharing with Auth0 for AI Agents

Built for the Auth0 for AI Agents Challenge, RouteWise demonstrates how autonomous AI agents can be both powerful and privacy-respecting.

🔗 Links:
• Live Demo: [your-vercel-url]
• GitHub: [your-github-repo]
• DEV.to Post: [your-dev-post]

⚙️ Tech Stack:
• Auth0 (M2M auth, Token Vault, Fine-grained authorization)
• OpenAI GPT-4
• Next.js, TypeScript
• Spotify, Google Maps APIs

🤖 Features:
• 4 Autonomous AI Agents
• Complete Auth0 Integration
• Zero Credentials in Code
• Full Audit Trail

Built in 1 week for the Auth0 Challenge 🏆

#Auth0 #AIAgents #MachineLearning #Privacy
```

---

## 🚀 Ready to Record?

### Final Prep (5 minutes):
1. Run your demo to make sure it works
2. Open Auth0 dashboard
3. Clean your desktop
4. Test your microphone
5. Have this script open nearby

### Record (15 minutes):
1. Take 1: Dry run
2. Take 2: First recording
3. Take 3: Final recording (use this one!)

### Upload (5 minutes):
1. Upload to YouTube/Loom
2. Copy the link
3. Add to your DEV.to post

---

## 🎉 You've Got This!

Remember:
- **Don't aim for perfection** - aim for "good enough"
- **Show enthusiasm** - judges want to see you're excited
- **Focus on Auth0** - that's what they're judging
- **Keep it short** - 4 minutes is perfect

The hardest part (building the project) is done. Recording the video is the easy part!

**Now go record and WIN this challenge!** 🏆🎬

---

**Pro Tip**: Record your video BEFORE writing your DEV.to post. You'll remember key points better and have screenshots to use!
