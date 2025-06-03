### How to run:

### Environment

add a .env file to your root with the following values:
DATABASE_URL=""
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_REGION=""
AWS_BUCKET_NAME=""
CLOUDFRONT_BASE_URL=""
OPENAI_API_KEY=""

### Database Commands

run the following commands to generate and migrate your database

```bash
npx drizzle-kit generate
# and
npx drizzle-kit migrate
```

### Install dependencies:

```bash
pnpm i
```

### Start project:

```bash
pnpm dev
```

### WIP

- Adding images to the prompt is currently only working for the inital prompt
