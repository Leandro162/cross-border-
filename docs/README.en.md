# Cross-border Navigation Station

Cross-border Navigation Station is a static directory for cross-border ecommerce resources, covering website building, payments, advertising networks, analytics, and AI tools.

## Project Structure

```text
.
├── .github/workflows/deploy-oss.yml
├── files/
│   ├── index.html
│   ├── app.js
│   ├── style.css
│   ├── deals.json
│   ├── privacy.html
│   └── terms.html
└── README.md
```

## Features

- Category filtering
- Search across names, descriptions, categories, and tags
- Sorting by view count
- Responsive desktop and mobile layouts
- JSON-driven resource cards
- Automated deployment to Aliyun OSS

## Local Preview

```bash
python3 -m http.server 8765 --directory files
```

Open `http://127.0.0.1:8765/`.

## Maintaining Resource Data

Resource records are stored in `files/deals.json`. Each record contains:

`id`, `name`, `logo`, `category`, `tag`, `description`, `url`, and `views`

## Deployment

After changes are pushed to `main`, GitHub Actions synchronizes the `files/` directory to the Aliyun OSS bucket.

## License

No open-source license has been specified for this repository.
