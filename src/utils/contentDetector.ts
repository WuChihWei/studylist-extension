interface PageInfo {
    type: 'webpage' | 'book' | 'video' | 'podcast';
    title: string;
    url: string;
    additionalInfo?: {
      author?: string;
      description?: string;
      thumbnail?: string;
      channelName?: string;
      episodeTitle?: string;
    };
  }
  
  export const detectContentType = (url: string, document: Document): PageInfo => {
    const hostname = new URL(url).hostname;
    
    // Get the most specific title possible
    const getTitle = () => {
      return (
        document.querySelector('h1')?.textContent?.trim() || 
        document.querySelector('meta[property="og:title"]')?.getAttribute('content')?.trim() ||
        document.title?.trim()
      );
    };
  
    // Book detection
    if (
      hostname.includes('amazon.com/books') ||
      hostname.includes('books.google.com') ||
      hostname.includes('goodreads.com') ||
      hostname.includes('kobo.com')
    ) {
      return {
        type: 'book',
        title: getTitle(),
        url: url,
        additionalInfo: {
          author: document.querySelector('.author')?.textContent?.trim() || undefined,
          thumbnail: document.querySelector('meta[property="og:image"]')?.getAttribute('content') || undefined
        }
      };
    }
  
    // Video detection
    if (
      hostname.includes('youtube.com') ||
      hostname.includes('vimeo.com') ||
      hostname.includes('ted.com/talks')
    ) {
      return {
        type: 'video',
        title: getTitle(),
        url: url,
        additionalInfo: {
          channelName: document.querySelector('[itemprop="author"]')?.textContent || undefined,
          thumbnail: document.querySelector('meta[property="og:image"]')?.getAttribute('content') || undefined
        }
      };
    }
  
    // Podcast detection
    if (
      hostname.includes('spotify.com/show') ||
      hostname.includes('podcasts.apple.com') ||
      hostname.includes('podcasts.google.com')
    ) {
      return {
        type: 'podcast',
        title: getTitle(),
        url: url,
        additionalInfo: {
          episodeTitle: document.querySelector('.episode-title')?.textContent || undefined,
          thumbnail: document.querySelector('meta[property="og:image"]')?.getAttribute('content') || undefined
        }
      };
    }
  
    // Default to webpage
    return {
      type: 'webpage',
      title: getTitle(),
      url: url,
      additionalInfo: {
        description: document.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() || undefined
      }
    };
  };
