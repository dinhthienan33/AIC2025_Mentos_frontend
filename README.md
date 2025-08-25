# Visual Search Frontend

A React-based frontend for the Visual Search application with video player functionality and timeline features.

## Features

- 🔍 **Visual Search Interface**: Search for content using text queries
- 🎥 **Video Player**: Embedded YouTube player with timestamp control
- ⏰ **Timeline Visualization**: Visual timeline showing start and end times
- 🖼️ **Keyframe Display**: Browse search results as keyframe images
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🎨 **Modern UI**: Dark theme with smooth animations

## Project Structure

```
src/
├── components/
│   ├── SearchInterface.js    # Main search interface
│   ├── SearchForm.js         # Search form and controls
│   ├── VideoList.js          # Video results display
│   ├── KeyframeGrid.js       # Keyframe grid view
│   └── VideoPlayer.js        # Video player with timeline
├── App.js                    # Main application component
├── App.css                   # All styles and CSS
└── index.js                  # Application entry point
```

## Setup Instructions

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm start
   ```

3. **Open your browser** and navigate to `http://localhost:3000`

### Build for Production

```bash
npm run build
```

This creates a `build` folder with optimized production files.

## Usage

### Search Interface
1. Enter your search query in the text input
2. Adjust search parameters (results count, score threshold, model)
3. Click "Search" to find matching content

### Video Player
1. Click on any keyframe image to open the video player
2. Video starts at the exact timestamp from search results
3. Use the timeline to see start/end markers
4. Click "Open in YouTube" to view in a new tab

### Navigation
- **Video List View**: Shows grouped search results by video
- **Keyframe View**: Browse individual keyframes for a selected video
- **Back Button**: Return to video list from keyframe view

## API Integration

The frontend connects to your backend API at `http://localhost:8000`. Make sure your backend is running and accessible.

### Expected API Response Format

```json
{
  "query": "search query",
  "total_results": 10,
  "processing_time": 0.245,
  "results": [
    {
      "keyframe_id": "L21_V003_keyframe_001234",
      "video_id": "L21_V003",
      "group_id": "L21",
      "keyframe_num": 1234,
      "timestamp": 41.13,
      "confidence_score": 0.95,
      "image_path": "L21_V003_keyframe_001234.webp",
      "image_url": "https://data2024official.blob.core.windows.net/...",
      "video_url": "https://youtube.com/watch?v=...&t=41s",
      "thumbnail_url": "https://i.ytimg.com/vi/.../sddefault.jpg"
    }
  ],
  "model_used": "jinav2"
}
```

## Customization

### Styling
- All styles are in `src/App.css`
- Uses CSS custom properties for easy theming
- Responsive design with mobile-first approach

### Components
- Each component is modular and can be easily modified
- Props are well-documented in component files
- State management is handled at the appropriate level

## Troubleshooting

### Common Issues

1. **API Connection Error**: Ensure your backend is running at `localhost:8000`
2. **Video Not Loading**: Check if YouTube URLs are accessible
3. **Styling Issues**: Verify CSS is properly imported

### Development Tips

- Use React Developer Tools for debugging
- Check browser console for error messages
- Verify API responses in Network tab

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the AIC2025 Visual Search application.
