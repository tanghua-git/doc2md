FROM node:20-alpine

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm install

# 复制代码
COPY . .

# 构建
RUN npm run build

EXPOSE 4173

CMD ["npm", "run", "preview"]
