import React, { useState, useEffect, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

// Import the scene quotes directly
const sceneQuotes = [
  "I caught a drumstick and mf contact high at the same time.",
  "Someone in the pit was wearing a cape. No one questioned it. I could hear Edna crying from a distance.",
  "A girl crowd-surfed holding a cold slice of pizza from Momo's. Took a bite mid-air. Iconic.",
  "I don't remember which show, but there was this one note Dantiza belted out, and it cured my seasonal depression.",
  "[FROG] **Cryptid Sighting Log**\n- Bassist seen giving relationship advice to someone in line at a Mayhew show. Like real, helpful advice. Like... charts were involved.\n- Someone passed out patches that read \"I survived the opener and all I got was this clarity.\"\n- Vocalist was barefoot the whole time. No one knows when the shoes came off. One shoe was later spotted on the amp.\n- Guitarist disappeared mid-set and came back with a different guitar. No questions asked.",
  "Someone screamed 'FREE BIRD' as a joke, and they played it. In minor key. At half speed. It fuckin slapped.",
  "My left shoe came off during the breakdown. I didn't try to get it back.",
  "A guy with a handlebar mustache just yelled 'YEAHHH!!!' between every verse. He wasn't with anyone. He also kept asking to hit peoples vape, and then proceed to start that weird small talk like 'oh what flavor is this, mango' like mf get your fix and leave",
  "I think the bassist was trying to flirt with the audience… or threaten us. Either way, I felt something.",
  "**Tonight's Forecast:**\nCry Probability: 34%\nPit Slippery Level: HIGH\nRisk of Unplanned Confessions: Oh honey.\nSomeone might vape onstage again. Prepare accordingly.\nFloor Stickiness: Questionable\nEmotional Slap Per Song: 2-3 min\nMic Cord Trip Hazard: Certified",
  "Someone in the front row had a kazoo and joined in. Nobody told them to stop. Nobody could.",
  "This band sounds like getting dumped via playlist. But, like, the playlist slaps.",
  "I forgot where I parked. And who I came with. But spiritually, I've arrived.",
  "Someone in the back kept yelling 'ONE MORE SONG' halfway through the set. They got it.",
  "**Stage Banter Bingo Activated:**\n\"We've only played this song one time, I hope its good!\" [CHECK]\n\"This one's unreleased. Probably for a reason.\" [CHECK]\n\"This is out last song *proceeds to play one more song*\" [CHECK]\n\"Shoutout to whoever brought fruit snacks to the front row.\" [CHECK]\n\"This one's for everyone who's ever cried in a Taco Bell parking lot.\" [CHECK]",
  "The merch guy sold me a shirt and said 'this one's cursed, just so you know.' I still bought it.",
  "I clapped off-beat and a stranger held my hand until I found the rhythm.",
  "There was a mosh pit and a slow dance happening at the same time.",
  "[FROG] **Cryptid Sighting Log**\n- Drummer ate a granola bar between songs but never stopped playing.\n- Someone in the crowd had a laminated setlist from a 2022 house show. Everyone bowed.\n- A guy in a mesh shirt performing ritual movements after each song. Not dancing, definitely ritual.\n- There was a mosh pit and someone in the middle was just crocheting. Steady hands. Fierce energy.",
  "The lead singer made eye contact with me during the breakdown. I panicked I think i matched with her on hinge.",
  "A guy with face glitter shouted, 'I'm in love with everyone here!' and five people shouted back, 'Same!'",
  "Someone tried to crowd-surf with a foldable camping chair. They succeeded.",
  "I saw 2  girls run back and forth across stadum drive, screaming and dancing, I later saw those same 2 girls standing in the taco bell drive thru at 2 am",
  "**SCENE ENERGY REPORT**\nMosh Magnetism: [BOOM][BOOM][BOOM][BOOM][BOOM] (someone's glasses flew off and got cheered)\nCry Factor: [CRY][CRY][CRY] (they opened with that one)\nDrip Level: [SHIRT][SPARKLE][SPARKLE][SPARKLE][SPARKLE] (two thrifted leather jackets, zero sleeves)\nMutual Energy: [HUG][HUG][HUG][HUG][HUG] (crowd was singing along to a band they didn't know)\nGenre Bending: [MIX][MIX][MIX][MIX]",
  "A fan brought a light-up sign that just said: 'Play the one that wrecked me.'",
  "I saw someone slam dunk a vape into a trash can and yell 'I'M FREE' before the drop hit.",
  "Someone screamed 'WHO HURT YOU?!' and the guitarist nodded solemnly.",
  "I watched someone shotgun a LaCroix and scream 'FOR THE FLIRT!' before slipping in their own dignity.",
  "**Mini Forecast Interruption:**\nShirtlessness Index: 3.5 members\nStage Dive Likelihood: Low but chaotic\nChance of Someone Crying Mid-Guitar Solo: 82%\nAmp Smoke Chance: Smelled something. Unconfirmed.\nOn-Stage Group Therapy Likelihood: 89%",
  "There was a guy holding a houseplant the whole show. He said it was 'the band's emotional support foliage.'",
  "Someone stage-dived with sunglasses on, at night, indoors. Lost them. Found a different pair.",
  "I was sobbing in the corner when someone handed me a sticker that just said 'Internet Girlfriend doesn't ghost you, she fades into noise.'",
  "I saw a dude selling hot dogs out of a messenger bag. They were cold. I still bought one.",
  "**Stage Banter Bingo Pt. II**\n\"We wrote this song for a friend who ghosted us and now they work at Trader Joe's.\" [CHECK]\n\"This song's in D minor. The saddest of all keys.\" [CHECK]\n\"We don't have merch, but I do have emotional baggage.\" [CHECK]\n\"Y'all ever scream so hard your chakras align?\" [CHECK]\n\"If you know the words, don't gatekeep.\" [CHECK]",
  "I caught a sticker that just said 'overstimulated but present.' It was covered in glitter and accountability.",
  "Someone threw a Fruit Roll-Up onto the stage and yelled 'INTERNET GIRLFRIEND SAVED MY LIFE!' The band nodded like this happens often.",
  "A crowd member pulled out a tarot deck and read someone's future during soundcheck. The card said 'cry later.'",
  "[FROG] **Cryptid Sighting Log**\n- Someone tried to break up with their partner during a set but forgot mid-verse and just bought a shirt instead.\n- The lead vocalist kept yelling \"this one's for YOU\" and pointing in five different directions.\n- Someone's shirt just said \"I survived Beloved Devotion and all I got was introspection.\"",
  "Band started a chant and forgot the words. We kept chanting anyway.",
  "Someone yelled 'I'M EMOTIONALLY AVAILABLE' during the chorus. Nobody responded. A single tear fell.",
  "I watched a guy slow dance with a backpack. I think they were in love.",
  "I wore a new shirt to impress the band. They complimented my socks. I'm spiraling.",
  "**Weather Report:**\nPit Moisture Index: Humid. Like someone's breath.\nGlitter Fallout: Everywhere. It's on your taxes now.\nAcoustic Interruption Probability: One guy with an acoustic guitar in the corner is thinking about it.\nVibe Consistency: Shaky but sentimental\nLikelihood of Public Apology Onstage: 63%",
  "Someone in the crowd screamed 'I LOVE YOU' and the bassist responded 'I'M NOT EMOTIONALLY AVAILABLE.' Everyone cheered anyway.",
  "I made eye contact with the synth player during the bridge and remembered every bad decision I ever made.",
  "I didn't know the band, but by the end of the set I was holding someone's hand and chanting with strangers."
];

const SceneSenna = memo(() => {
  const [displayText, setDisplayText] = useState("");
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [timeoutCount, setTimeoutCount] = useState(0);
  const [specialMessage, setSpecialMessage] = useState("");
  const textContainerRef = useRef(null);
  const autoAdvanceTimerRef = useRef(null);
  const specialMessageTimerRef = useRef(null);

  // Scroll to bottom when text changes
  useEffect(() => {
    if (textContainerRef.current) {
      textContainerRef.current.scrollTop = textContainerRef.current.scrollHeight;
    }
  }, [displayText]);

  // Function to clear all timers
  const clearAllTimers = () => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    if (specialMessageTimerRef.current) {
      clearTimeout(specialMessageTimerRef.current);
      specialMessageTimerRef.current = null;
    }
  };

  // Function to setup auto-advance timer
  const setupAutoAdvanceTimer = () => {
    clearAllTimers();
    
    // Set up a timer to auto-advance after 8 seconds of finishing typing
    autoAdvanceTimerRef.current = setTimeout(() => {
      // Show special message based on timeout count
      if (timeoutCount < 3) {
        setSpecialMessage("FINE, I'LL PRESS IT!");
      } else {
        setSpecialMessage("CAN YOU READ ANY FASTER?");
        // Reset timeout count after showing the special message
        setTimeoutCount(0);
      }
      
      // Show the special message for 1 second
      specialMessageTimerRef.current = setTimeout(() => {
        setSpecialMessage("");
        // Generate a new quote
        generateNewQuote();
        // Increment the timeout count
        setTimeoutCount(prev => prev + 1);
      }, 1000);
    }, 8000);
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => clearAllTimers();
  }, []);

  // Function to simulate typing with random pauses and occasional backspacing
  const typeWriter = async (text, index = 0, isBackspacing = false, backspaceCount = 0) => {
    // If we're backspacing
    if (isBackspacing) {
      // Get current text length
      const currentLength = displayText.length;
      
      // If we still have characters to delete
      if (backspaceCount > 0 && currentLength > 0) {
        // Delete one character
        setDisplayText(prev => prev.substring(0, prev.length - 1));
        
        // Continue backspacing with reduced count
        const backspaceTimer = setTimeout(() => {
          typeWriter(text, index, true, backspaceCount - 1);
        }, 20); // Backspace is faster than typing
        
        return () => clearTimeout(backspaceTimer);
      } else {
        // Resume typing after backspacing
        const resumeTimer = setTimeout(() => {
          typeWriter(text, index);
        }, 40);
        
        return () => clearTimeout(resumeTimer);
      }
      return;
    }
    
    // Normal typing mode
    if (index < text.length) {
      setIsTyping(true);
      
      // Random typing speed between 20ms and 80ms
      const typingSpeed = Math.floor(Math.random() * 60) + 20;
      
      // Occasionally add a longer pause (5% chance) but reduce by 80%
      const shouldPause = Math.random() < 0.05;
      const pauseDuration = shouldPause ? Math.floor((Math.random() * 800) + 200) * 0.2 : 0;
      
      // Occasionally backspace (3% chance)
      const shouldBackspace = Math.random() < 0.03 && index > 3;
      
      if (shouldBackspace) {
        // Determine how many characters to backspace (1-3)
        const backspaceCount = Math.floor(Math.random() * 3) + 1;
        
        // Add the current character first
        setDisplayText(prev => text.substring(0, index + 1));
        
        // Then start backspacing after a small delay
        const backspaceStartTimer = setTimeout(() => {
          typeWriter(text, index, true, Math.min(backspaceCount, index));
        }, typingSpeed + pauseDuration);
        
        return () => clearTimeout(backspaceStartTimer);
      } else {
        // Normal typing
        const typingTimer = setTimeout(() => {
          // Add one character at a time without modifying previous text
          setDisplayText(prev => text.substring(0, index + 1));
          typeWriter(text, index + 1);
        }, typingSpeed + pauseDuration);
        
        return () => clearTimeout(typingTimer);
      }
    } else {
      setIsTyping(false);
      // No longer automatically starting a new quote
      // Instead, set up the auto-advance timer
      setupAutoAdvanceTimer();
    }
  };

  // Generate a new quote when the button is clicked
  const generateNewQuote = () => {
    // Clear any existing timers
    clearAllTimers();
    
    if (!isTyping) {
      // Clear the display
      setDisplayText("");
      setSpecialMessage("");
      
      // Get a new random quote that's different from the current one
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * sceneQuotes.length);
      } while (randomIndex === currentQuoteIndex && sceneQuotes.length > 1);
      
      setCurrentQuoteIndex(randomIndex);
      
      // Start typing the new quote
      typeWriter(sceneQuotes[randomIndex]);
    }
  };

  // Start typing when component mounts
  useEffect(() => {
    // Start with a random quote
    const initialIndex = Math.floor(Math.random() * sceneQuotes.length);
    setCurrentQuoteIndex(initialIndex);
    
    // Clear any existing text first
    setDisplayText("");
    
    // Start typing with a clean slate
    const timer = setTimeout(() => {
      typeWriter(sceneQuotes[initialIndex]);
    }, 500);
    
    return () => clearTimeout(timer); // Cleanup timeout on unmount
  }, []); // Empty dependency array means this runs once on mount

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black flex flex-col items-center justify-center">
      {/* VHS Background Effect with Orange Theme */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* VHS Tape Startup Effect */}
        <div className="absolute inset-0 bg-black animate-vhsStartup"></div>
        
        {/* Base dark background */}
        <div className="absolute inset-0 bg-[#111]"></div>
        
        {/* Orange gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-700/70 to-orange-900/50 opacity-60 animate-vhsFadeIn"></div>
        
        {/* Noise overlay */}
        <div className="absolute inset-0 bg-noise opacity-20 mix-blend-overlay animate-vhsNoiseIn"></div>
        
        {/* VHS scan lines */}
        <div className="absolute inset-0 bg-scanlines opacity-30 animate-vhsScanIn"></div>
        
        {/* VHS Startup Flicker */}
        <div className="absolute inset-0 bg-orange-500/10 animate-vhsFlicker"></div>
        
        {/* Horizontal tracking lines that occasionally shift - positioned away from text */}
        <div className="absolute inset-0">
          <div className="h-[2px] w-full bg-orange-500/30 animate-trackingLine1 absolute top-[10%]"></div>
          <div className="h-[3px] w-full bg-orange-400/20 animate-trackingLine2 absolute top-[90%]"></div>
          <div className="h-[1px] w-full bg-orange-300/40 animate-trackingLine3 absolute top-[40%]"></div>
        </div>
        
        {/* Vertical tracking lines - moved to sides */}
        <div className="absolute inset-0 flex justify-between">
          <div className="w-[1px] h-full bg-orange-500/10 animate-verticalTrack left-[5%]"></div>
          <div className="w-[2px] h-full bg-orange-400/15 animate-verticalTrack delay-300 right-[5%]"></div>
          <div className="w-[1px] h-full bg-orange-300/10 animate-verticalTrack delay-700 left-[95%]"></div>
        </div>
        
        {/* Color shift effect */}
        <div className="absolute inset-0 bg-orange-500/5 animate-colorShift mix-blend-color"></div>
        
        {/* VHS glitch elements - positioned away from text */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute h-[5px] w-full bg-orange-600/30 animate-glitch1 top-[5%]"></div>
          <div className="absolute h-[3px] w-full bg-orange-500/40 animate-glitch2 top-[95%]"></div>
          <div className="absolute h-[7px] w-full bg-orange-400/20 animate-glitch3 top-[80%]"></div>
        </div>
        
        {/* Random horizontal glitches - positioned away from text */}
        <div className="absolute inset-0">
          <div className="absolute h-[15px] w-[100px] bg-orange-500/30 animate-randomGlitch1 left-[5%] top-[15%]"></div>
          <div className="absolute h-[8px] w-[200px] bg-orange-400/20 animate-randomGlitch2 left-[80%] top-[85%]"></div>
          <div className="absolute h-[12px] w-[150px] bg-orange-600/25 animate-randomGlitch3 left-[10%] top-[95%]"></div>
        </div>
        
        {/* Color bleeding effect - positioned away from text */}
        <div className="absolute inset-0">
          <div className="absolute left-0 right-0 h-[3px] bg-red-500/20 top-[5%] animate-colorBleed"></div>
          <div className="absolute left-0 right-0 h-[2px] bg-orange-500/30 top-[95%] animate-colorBleed delay-500"></div>
          <div className="absolute left-0 right-0 h-[4px] bg-orange-400/25 top-[85%] animate-colorBleed delay-1000"></div>
        </div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-2xl p-6 h-[80vh] flex flex-col">
        {/* Title */}
        <motion.div 
          className="text-center mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 
            className="text-4xl font-bold mb-2 title-flicker" 
            style={{ 
              fontFamily: "'Orbitron', sans-serif",
              background: "linear-gradient(90deg, #ff8a00, #ff5e00)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textShadow: "0 0 8px rgba(255,165,0,0.5)"
            }}
          >
            Scene Senna
          </h1>
          <p className="text-gray-400">Chaotic and heartfelt scene reports</p>
        </motion.div>

        {/* Text Display Area - Adding a stable positioning context */}
        <div 
          className="flex-grow relative bg-black/80 backdrop-blur-md rounded-lg p-6 mb-4 overflow-auto text-container"
          ref={textContainerRef}
          style={{ 
            transform: 'translateZ(0)', // Force GPU acceleration for stability
            willChange: 'transform', // Optimize for animations
            isolation: 'isolate', // Create a new stacking context
            boxShadow: '0 0 20px rgba(0,0,0,0.5)', // Add shadow for depth
            border: '1px solid rgba(255,165,0,0.2)' // Subtle orange border
          }}
        >
          <motion.div
            className="text-gray-200 whitespace-pre-line text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            key={`text-display-${currentQuoteIndex}`}
            style={{ 
              position: 'relative', 
              zIndex: 20,
              textShadow: '0 0 2px rgba(255,255,255,0.5)', // Add slight glow for readability
              fontFamily: "'Courier New', monospace" // Use monospace font for terminal feel
            }}
          >
            {displayText}
            {isTyping && <span className="animate-pulse">_</span>}
          </motion.div>
        </div>
        
        {/* Controls */}
        <div className="p-3 border-t border-gray-800 bg-black/80 flex justify-between items-center">
          <div className="text-xs text-gray-400">
            {isTyping ? (
              <span>TYPING...</span>
            ) : specialMessage ? (
              <span className="text-orange-400 font-bold">{specialMessage}</span>
            ) : (
              <span>READY</span>
            )}
          </div>
          <button
            onClick={generateNewQuote}
            className="bg-gray-800 text-gray-200 p-2 rounded hover:bg-gray-700 transition flex items-center"
            disabled={isTyping}
          >
            <RefreshCw size={16} className={`mr-1 ${isTyping ? 'animate-spin' : ''}`} />
            <span className="text-xs">NEW MESSAGE</span>
          </button>
        </div>
        
        {/* Upgrade Notice */}
        <div className="text-xs text-gray-500 text-center mt-2 mb-1">
          scene senna is currently being upgraded, for now she just says wacky stuff :)
        </div>
      </div>

      {/* Add custom CSS for animations and effects */}
      <style jsx global>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        
        .animate-blink {
          animation: blink 1s step-end infinite;
        }
        
        /* VHS Tracking Effect */
        @keyframes vhsTracking {
          0% { transform: translateY(0); }
          5% { transform: translateY(-1px); }
          10% { transform: translateY(1px); }
          15% { transform: translateY(-1px); }
          20% { transform: translateY(0); }
          100% { transform: translateY(0); }
        }
        
        .vhs-effect {
          position: relative;
          animation: vhsTracking 8s infinite;
        }
        
        .vhs-effect::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            to bottom,
            transparent 0%,
            rgba(255, 255, 255, 0.02) 50%,
            transparent 100%
          );
          pointer-events: none;
          z-index: 1;
        }
        
        /* VHS Overlay */
        .vhs-overlay {
          background: 
            linear-gradient(to bottom, rgba(255, 165, 0, 0.05), rgba(255, 69, 0, 0.05)),
            repeating-linear-gradient(transparent, transparent 2px, rgba(0, 0, 0, 0.1) 3px, rgba(0, 0, 0, 0.1) 3px);
          mix-blend-mode: screen;
          pointer-events: none;
        }
        
        /* VHS Glitch Lines */
        @keyframes glitchLines {
          0% { opacity: 0; }
          10% { opacity: 0.3; transform: translateX(0); }
          12% { opacity: 0.5; transform: translateX(5px); }
          14% { opacity: 0.3; transform: translateX(0); }
          35% { opacity: 0; }
          90% { opacity: 0; }
          92% { opacity: 0.4; transform: translateX(-3px); }
          94% { opacity: 0; }
          100% { opacity: 0; }
        }
        
        .vhs-glitch-lines {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 140, 0, 0.2) 30%,
            rgba(255, 140, 0, 0.4) 50%,
            rgba(255, 140, 0, 0.2) 70%,
            transparent 100%
          );
          animation: glitchLines 8s infinite;
        }
        
        /* VHS Color Shift */
        @keyframes colorShift {
          0% { opacity: 0; }
          20% { opacity: 0; }
          21% { opacity: 0.2; }
          22% { opacity: 0; }
          30% { opacity: 0; }
          31% { opacity: 0.3; }
          32% { opacity: 0; }
          70% { opacity: 0; }
          71% { opacity: 0.4; }
          72% { opacity: 0; }
          80% { opacity: 0; }
          81% { opacity: 0.2; }
          82% { opacity: 0; }
          100% { opacity: 0; }
        }
        
        .vhs-color-shift {
          background: 
            linear-gradient(45deg, rgba(255, 69, 0, 0.2), rgba(255, 165, 0, 0.2)),
            radial-gradient(circle at 50% 50%, rgba(255, 140, 0, 0.3), transparent 70%);
          animation: colorShift 10s infinite;
        }
        
        /* Tracking Lines */
        @keyframes trackingMove {
          0% { background-position: 0 0; }
          100% { background-position: 0 100vh; }
        }
        
        .tracking-lines {
          background: repeating-linear-gradient(
            to bottom,
            transparent 0px,
            transparent 3px,
            rgba(255, 140, 0, 0.03) 3px,
            rgba(255, 140, 0, 0.03) 6px
          );
          animation: trackingMove 10s linear infinite;
        }
        
        /* Noise Background */
        .bg-noise {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          opacity: 0.15;
        }
        
        /* Make sure the page container takes up the full viewport */
        .page-container {
          min-height: 100vh;
          width: 100%;
          background-color: #111;
        }
        
        /* Tracking Line Animations */
        @keyframes trackingLine1 {
          0% { transform: translateY(0); }
          10% { transform: translateY(-1px); }
          20% { transform: translateY(1px); }
          30% { transform: translateY(-1px); }
          40% { transform: translateY(0); }
          100% { transform: translateY(0); }
        }
        
        .animate-trackingLine1 {
          animation: trackingLine1 8s infinite;
        }
        
        @keyframes trackingLine2 {
          0% { transform: translateY(0); }
          15% { transform: translateY(-2px); }
          30% { transform: translateY(2px); }
          45% { transform: translateY(-2px); }
          60% { transform: translateY(0); }
          100% { transform: translateY(0); }
        }
        
        .animate-trackingLine2 {
          animation: trackingLine2 10s infinite;
        }
        
        @keyframes trackingLine3 {
          0% { transform: translateY(0); }
          20% { transform: translateY(-3px); }
          40% { transform: translateY(3px); }
          60% { transform: translateY(-3px); }
          80% { transform: translateY(0); }
          100% { transform: translateY(0); }
        }
        
        .animate-trackingLine3 {
          animation: trackingLine3 12s infinite;
        }
        
        /* Vertical Tracking Line Animations */
        @keyframes verticalTrack {
          0% { transform: translateX(0); }
          10% { transform: translateX(-1px); }
          20% { transform: translateX(1px); }
          30% { transform: translateX(-1px); }
          40% { transform: translateX(0); }
          100% { transform: translateX(0); }
        }
        
        .animate-verticalTrack {
          animation: verticalTrack 8s infinite;
        }
        
        /* Glitch Animations */
        @keyframes glitch1 {
          0% { transform: translateY(0); }
          10% { transform: translateY(-5px); }
          20% { transform: translateY(5px); }
          30% { transform: translateY(-5px); }
          40% { transform: translateY(0); }
          100% { transform: translateY(0); }
        }
        
        .animate-glitch1 {
          animation: glitch1 8s infinite;
        }
        
        @keyframes glitch2 {
          0% { transform: translateY(0); }
          15% { transform: translateY(-3px); }
          30% { transform: translateY(3px); }
          45% { transform: translateY(-3px); }
          60% { transform: translateY(0); }
          100% { transform: translateY(0); }
        }
        
        .animate-glitch2 {
          animation: glitch2 10s infinite;
        }
        
        @keyframes glitch3 {
          0% { transform: translateY(0); }
          20% { transform: translateY(-2px); }
          40% { transform: translateY(2px); }
          60% { transform: translateY(-2px); }
          80% { transform: translateY(0); }
          100% { transform: translateY(0); }
        }
        
        .animate-glitch3 {
          animation: glitch3 12s infinite;
        }
        
        /* Random Glitch Animations */
        @keyframes randomGlitch1 {
          0% { transform: translateX(0); }
          10% { transform: translateX(-10px); }
          20% { transform: translateX(10px); }
          30% { transform: translateX(-10px); }
          40% { transform: translateX(0); }
          100% { transform: translateX(0); }
        }
        
        .animate-randomGlitch1 {
          animation: randomGlitch1 8s infinite;
        }
        
        @keyframes randomGlitch2 {
          0% { transform: translateX(0); }
          15% { transform: translateX(-5px); }
          30% { transform: translateX(5px); }
          45% { transform: translateX(-5px); }
          60% { transform: translateX(0); }
          100% { transform: translateX(0); }
        }
        
        .animate-randomGlitch2 {
          animation: randomGlitch2 10s infinite;
        }
        
        @keyframes randomGlitch3 {
          0% { transform: translateX(0); }
          20% { transform: translateX(-3px); }
          40% { transform: translateX(3px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(0); }
          100% { transform: translateX(0); }
        }
        
        .animate-randomGlitch3 {
          animation: randomGlitch3 12s infinite;
        }
        
        /* Color Bleed Animations */
        @keyframes colorBleed {
          0% { transform: translateY(0); }
          10% { transform: translateY(-2px); }
          20% { transform: translateY(2px); }
          30% { transform: translateY(-2px); }
          40% { transform: translateY(0); }
          100% { transform: translateY(0); }
        }
        
        .animate-colorBleed {
          animation: colorBleed 8s infinite;
        }
        
        /* Color Shift Animation */
        @keyframes colorShift {
          0% { opacity: 0; }
          20% { opacity: 0; }
          21% { opacity: 0.2; }
          22% { opacity: 0; }
          30% { opacity: 0; }
          31% { opacity: 0.3; }
          32% { opacity: 0; }
          70% { opacity: 0; }
          71% { opacity: 0.4; }
          72% { opacity: 0; }
          80% { opacity: 0; }
          81% { opacity: 0.2; }
          82% { opacity: 0; }
          100% { opacity: 0; }
        }
        
        .animate-colorShift {
          animation: colorShift 10s infinite;
        }
        
        /* VHS Startup Animations */
        @keyframes vhsStartup {
          0% { opacity: 1; }
          10% { opacity: 1; }
          15% { opacity: 0.8; }
          20% { opacity: 0.9; }
          30% { opacity: 0.7; }
          40% { opacity: 0.2; }
          50% { opacity: 0.1; }
          60% { opacity: 0; }
          100% { opacity: 0; }
        }
        
        .animate-vhsStartup {
          animation: vhsStartup 4s ease-out forwards;
        }
        
        @keyframes vhsFadeIn {
          0% { opacity: 0; }
          50% { opacity: 0; }
          70% { opacity: 0.3; }
          90% { opacity: 0.5; }
          100% { opacity: 0.6; }
        }
        
        .animate-vhsFadeIn {
          animation: vhsFadeIn 3s ease-in forwards;
        }
        
        @keyframes vhsNoiseIn {
          0% { opacity: 0; }
          40% { opacity: 0; }
          60% { opacity: 0.1; }
          80% { opacity: 0.15; }
          100% { opacity: 0.2; }
        }
        
        .animate-vhsNoiseIn {
          animation: vhsNoiseIn 3.5s ease-in forwards;
        }
        
        @keyframes vhsScanIn {
          0% { opacity: 0; }
          30% { opacity: 0; }
          50% { opacity: 0.1; }
          70% { opacity: 0.2; }
          100% { opacity: 0.3; }
        }
        
        .animate-vhsScanIn {
          animation: vhsScanIn 4s ease-in forwards;
        }
        
        @keyframes vhsFlicker {
          0% { opacity: 0; }
          10% { opacity: 0.5; }
          12% { opacity: 0.2; }
          14% { opacity: 0.7; }
          16% { opacity: 0.3; }
          18% { opacity: 0.8; }
          20% { opacity: 0.5; }
          22% { opacity: 0.2; }
          24% { opacity: 0.9; }
          26% { opacity: 0.4; }
          28% { opacity: 0.6; }
          30% { opacity: 0.2; }
          35% { opacity: 0.3; }
          40% { opacity: 0.1; }
          45% { opacity: 0.05; }
          50% { opacity: 0; }
          100% { opacity: 0; }
        }
        
        .animate-vhsFlicker {
          animation: vhsFlicker 5s ease-out forwards;
        }
        
        /* Title Flicker Animation */
        @keyframes titleFlicker {
          0% { opacity: 1; }
          3% { opacity: 0.8; }
          6% { opacity: 1; }
          9% { opacity: 0.9; }
          12% { opacity: 1; }
          30% { opacity: 1; }
          33% { opacity: 0.8; }
          36% { opacity: 1; }
          60% { opacity: 1; }
          63% { opacity: 0.9; }
          66% { opacity: 1; }
          80% { opacity: 1; }
          83% { opacity: 0.8; }
          86% { opacity: 1; }
          100% { opacity: 1; }
        }
        
        .title-flicker {
          animation: titleFlicker 4s infinite;
          position: relative;
        }
        
        .title-flicker::before {
          content: "Scene Senna";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0.4;
          filter: blur(1px);
          animation: titleFlicker 3s infinite 0.5s;
          background: linear-gradient(90deg, #ff8a00, #ff5e00);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>
    </div>
  );
});

export default SceneSenna;