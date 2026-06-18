export function extractSongQuery(command: string): string | null {
  const lowerCmd = command.toLowerCase().trim();
  
  // Clean assistant names or common prefixes
  let clean = lowerCmd
    .replace(/\bsadhna\b/g, "")
    .replace(/\bsinha\b/g, "")
    .replace(/\bzoya\b/g, "")
    .trim();
  
  if (!clean) return null;

  // Patterns for playing songs
  const playPatterns = [
    /^(?:play|sing|gao|sunaao|suna|bajao|chalao|run)\s+(.+?)(?:\s+song)?$/,
    /^(.+?)\s+(?:gao|sunaao|suna|bajao|chalao|song|sing)$/
  ];
  
  for (const regex of playPatterns) {
    const match = clean.match(regex);
    if (match) {
      let song = match[1].trim();
      song = song.replace(/\s+on\s+youtube$/, "");
      song = song.replace(/\s+on\s+spotify$/, "");
      song = song.replace(/\s+song$/, "");
      song = song.replace(/^song\s+/, "");
      if (song.length > 1) {
        return song;
      }
    }
  }
  
  // Clean up and check if contains general music, song, or artist commands
  if (
    clean.includes("song") ||
    clean.includes("gana") ||
    clean.includes("music") ||
    clean.includes("sing") ||
    clean.includes("gao") ||
    clean.includes("suna") ||
    clean.includes("spotify") ||
    clean.includes("youtube") ||
    clean.includes("bajao") ||
    clean.includes("pal pal")
  ) {
    let query = clean
      .replace(/\b(play|sing|gao|sunaao|suna|bajao|chalao|song|gana|lyrics|audio|video|on|youtube|spotify|search)\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    
    // If they just said "gana gao" or "sing a song", play a default amazing track!
    if (query.length <= 1) {
      return "Pal Pal Dil Ke Paas";
    }
    return query;
  }
  
  return null;
}

export function processCommand(command: string): {
  action: string;
  url?: string;
  isBrowserAction: boolean;
  isSongPlay?: boolean;
  songQuery?: string;
} {
  const lowerCmd = command.toLowerCase().trim();

  // 1. First, check if it's asking to sing/play a song directly (or any reference to music/spotify/youtube play)
  const songQuery = extractSongQuery(command);
  if (songQuery || lowerCmd.includes("spotify") || lowerCmd.includes("youtube") || lowerCmd.includes("play") || lowerCmd.includes("sing") || lowerCmd.includes("song")) {
    const finalQuery = songQuery || "Pal Pal Dil Ke Paas";
    return {
      action: `Aww, mere surile gale se gaana sunna hai? Thoda sabar rakho Himanshu, abhi bajati hu aapke liye: ${finalQuery}! 🎵✨`,
      isBrowserAction: false,
      isSongPlay: true,
      songQuery: finalQuery,
    };
  }

  // General Browsing: "Open [website name]"
  const openMatch = lowerCmd.match(/^open\s+(.+)$/);
  if (
    openMatch &&
    !lowerCmd.includes("youtube") &&
    !lowerCmd.includes("spotify")
  ) {
    let website = openMatch[1].trim().replace(/\s+/g, "");
    if (!website.includes(".")) {
      website += ".com";
    }
    return {
      action: `Opening ${openMatch[1]} for you, ugh.`,
      url: `https://www.${website}`,
      isBrowserAction: true,
    };
  }

  // WhatsApp Web: "Send a WhatsApp message to [number] saying [message]"
  const waMatch = lowerCmd.match(
    /^send\s+a\s+whatsapp\s+message\s+to\s+([\d\+\s]+)\s+saying\s+(.+)$/,
  );
  if (waMatch) {
    const number = waMatch[1].replace(/\s+/g, "");
    const message = encodeURIComponent(waMatch[2].trim());
    return {
      action: `Sending your message. Let's hope they reply, Himanshu Kumar Sinha.`,
      url: `https://web.whatsapp.com/send?phone=${number}&text=${message}`,
      isBrowserAction: true,
    };
  }

  return { action: "", isBrowserAction: false };
}
