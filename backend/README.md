backend/
│
├── src/
│   ├── app.js
│   ├── server.js
│   │
│   ├── config/
│   │   ├── index.js
│   │   ├── logger.js
│   │   ├── swagger.js
│   │   ├── rateLimit.js
│   │   └── env.js
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   └── index.js
│   │
│   ├── controllers/
│   │   └── auth.controller.js
│   │
│   ├── services/
│   │   └── auth.service.js
│   │
│   ├── middlewares/
│   │   ├── error.middleware.js
│   │   └── auth.middleware.js
│   │
│   ├── utils/
│   │   ├── apiResponse.js
│   │   ├── apiError.js
│   │   └── asyncHandler.js
│   │
│   ├── lib/
│   │   ├── axios.js
│   │   └── jwt.js
│   │
│   ├── docs/
│   │   └── swagger.yaml
│   │
│   └── constants/
│       ├── apiPaths.js
│       ├── httpStatus.js
│       └── index.js
│
├── logs/
│   ├── error/
│   └── combined/
│
├── .env
├── .env.example
├── .gitignore
├── package.json
└── README.md