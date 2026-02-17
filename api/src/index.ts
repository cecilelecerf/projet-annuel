import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "api/prisma/generated/prisma/client";
import "dotenv/config";
import express from "express";
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

const app = express();

app.use(express.json());
app.get("/test", async (req, res) => {
  console.log("test");
  res.json("test");
});
// app.post(`/signup`, async (req, res) => {
//   const { name, email, posts } = req.body;

//   const postData = posts?.map((post: Prisma.PostCreateInput) => {
//     return { title: post?.title, content: post?.content };
//   });

//   const result = await prisma.user.create({
//     data: {
//       name,
//       email,
//       posts: {
//         create: postData,
//       },
//     },
//   });
//   res.json(result);
// });

// app.post(`/post`, async (req, res) => {
//   const { title, content, authorEmail } = req.body;
//   const result = await prisma.post.create({
//     data: {
//       title,
//       content,
//       author: { connect: { email: authorEmail } },
//     },
//   });
//   res.json(result);
// });

const server = app.listen(3000, () =>
  console.log(`
🚀 Server ready at: http://localhost:3000
⭐️ See sample requests: https://github.com/prisma/prisma-examples/blob/latest/orm/express/README.md#using-the-rest-api`),
);
