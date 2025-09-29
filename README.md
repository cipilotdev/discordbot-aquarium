# Discord Bot Aquarium 🤖

A powerful, modular Discord bot with AI integration, interactive games, and utility commands. Built with Node.js and Discord.js v14.

## ✨ Features

### 🤖 AI Integration

- **CIA AI**: Advanced AI system with conversation memory
- **OpenAI GPT**: ChatGPT integration for intelligent responses
- **Hugging Face**: Open-source AI models (Llama-3)

### 🎮 Interactive Games

- **Tic-Tac-Toe**: Play with friends with fancy ASCII board display
- Expandable game system for future additions

### 🛠️ Utility Commands

- **System Information**: Display server stats, memory usage, uptime
- **Help System**: Comprehensive command documentation
- **Health Monitoring**: Real-time system status

### 📊 Advanced Features

- Rate limiting to prevent spam
- Comprehensive logging system
- Database integration with conversation memory
- Error handling and recovery
- Performance optimization
- Modular command structure

## 🚀 Quick Start

### Prerequisites

- Node.js 18.0.0 or higher
- Discord Bot Token
- API Keys (optional but recommended)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/cipilotdev/discordbot-aquarium.git
cd discordbot-aquarium
```

2. **Install dependencies**

```bash
npm install
```

3. **Environment Setup**

```bash
cp .env.example .env
# Edit .env with your tokens and API keys
```

4. **Run Health Check**

```bash
npm run health-check
```

5. **Start the Bot**

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## ⚙️ Configuration

Create a `.env` file in the root directory:

```env
# Discord Bot Token (Required)
DISCORD_BOT_TOKEN=your_discord_bot_token

# AI API Keys (Optional but recommended)
CIA_API_KEY=your_cia_api_key
OPENAI_API_KEY=your_openai_api_key
HF_API_KEY=your_hugging_face_api_key

# Database (Optional - for conversation memory)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_key

# External APIs (Optional)
MEME_API_URL=https://meme-api.com/gimme
```

## 📚 Commands

### AI Commands

- `!cia <question>` - Ask CIA's advanced AI system
- `!gpt <question>` - Ask OpenAI's GPT
- `!hf <question>` - Ask Hugging Face models

### Game Commands

- `!tictactoe new` - Start a new tic-tac-toe game
- `!tictactoe join @user` - Join someone's game
- `!tictactoe move <1-9>` - Make a move
- `!tictactoe status` - Show current game board
- `!tictactoe quit` - End current game

### Utility Commands

- `!help [command]` - Show help information
- `!info` - Display system information
- `!meme` - Get a random meme

## 🏗️ Architecture

```
src/
├── ai/                 # AI service integrations
│   ├── cia.js         # CIA AI service
│   ├── gpt.js         # OpenAI GPT service
│   └── hf.js          # Hugging Face service
├── command/           # Discord commands
│   ├── fun/           # Entertainment commands
│   │   ├── cia.js     # CIA command
│   │   ├── gpt.js     # GPT command
│   │   ├── hf.js      # HF command
│   │   ├── meme.js    # Meme command
│   │   └── tictactoe.js # Tic-tac-toe game
│   └── utility/       # Utility commands
│       ├── help.js    # Help system
│       └── info.js    # System information
├── config/            # Configuration management
│   └── index.js       # Main configuration
├── games/             # Game implementations
│   └── tictactoe/     # Tic-tac-toe game logic
├── services/          # Core services
│   └── database.js    # Database operations
├── utils/             # Utility functions
│   ├── logger.js      # Logging system
│   ├── rateLimiter.js # Rate limiting
│   └── validator.js   # Input validation
└── index.js           # Main bot file
```

## 🔧 Development

### Running in Development Mode

```bash
npm run dev
```

### Linting

```bash
npm run lint
npm run lint:fix
```

### Testing

```bash
npm test
```

### Health Check

```bash
npm run health-check
```

## 📈 Performance Features

### Rate Limiting

- AI commands: 10 requests per minute per user
- General commands: 5 requests per 5 seconds per user
- Automatic cleanup to prevent memory leaks

### Caching

- Database query caching (5-minute TTL)
- Command result caching where applicable
- Memory optimization with periodic cleanup

### Error Handling

- Comprehensive error logging
- Graceful degradation for API failures
- User-friendly error messages
- Automatic retry mechanisms

### Monitoring

- Real-time health checks
- Performance metrics logging
- System resource monitoring
- Database connection pooling

## 🎮 Tic-Tac-Toe Game

The tic-tac-toe implementation features:

- **Clean ASCII Board**: Easy-to-read game state
- **Real-time Updates**: Instant game state updates
- **Multiple Games**: Support for concurrent games
- **Auto-cleanup**: Games expire after 5 minutes of inactivity
- **User-friendly**: Clear instructions and error messages

### Game Flow

1. Player 1 starts a new game with `!tictactoe new`
2. Player 2 joins with `!tictactoe join @player1`
3. Players take turns with `!tictactoe move <1-9>`
4. Game ends when someone wins or it's a draw
5. Use `!tictactoe status` to check current board

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test them
4. Commit your changes: `git commit -am 'Add new feature'`
5. Push to the branch: `git push origin feature-name`
6. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- Create an [issue](https://github.com/cipilotdev/discordbot-aquarium/issues) for bug reports
- Join our Discord server for community support
- Check the [wiki](https://github.com/cipilotdev/discordbot-aquarium/wiki) for documentation

## 🙏 Acknowledgments

- [Discord.js](https://discord.js.org/) - Discord API library
- CIA AI System - Advanced AI capabilities
- [OpenAI](https://openai.com/) - GPT models
- [Hugging Face](https://huggingface.co/) - Open-source AI models
- [Supabase](https://supabase.com/) - Database and backend services

---

Made with ❤️ for the Discord community
