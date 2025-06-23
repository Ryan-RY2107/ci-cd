const express = require('express');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const repoDir = '/Users/renyi/Desktop/Efrei/efrei/S8/DevOps_and_MLOps/ci-cd-pipeline'; // <-- 去掉路径末尾空格
const repoUrl = 'https://github.com/Ryan-RY2107/ci-cd.git';

const repoName = path.basename(repoUrl, '.git');
const fullPath = path.join(repoDir, repoName);

// ✅ 新增首页路由，避免 GET / 报 404
app.get('/', (req, res) => {
  res.send('✅ Webhook listener is running. POST /webhook to trigger deployment.');
});

app.post('/webhook', (req, res) => {
  try {
    if (!fs.existsSync(repoDir)) fs.mkdirSync(repoDir, { recursive: true });
    process.chdir(repoDir);

    if (!fs.existsSync(fullPath)) {
      execSync(`git clone ${repoUrl}`);
    }

    process.chdir(fullPath);
    execSync('git checkout main');
    execSync('git pull origin main');

    try {
      execSync('docker compose down');
    } catch {}

    const imageNames = execSync('docker compose config --services')
      .toString()
      .trim()
      .split('\n')
      .map(service => {
        const image = execSync(`docker compose config | awk '/${service}:/{flag=1;next}/image:/{if(flag){print $2;flag=0}}'`).toString().trim();
        return image || null;
      }).filter(Boolean);

    imageNames.forEach(image => {
      try {
        execSync(`docker rmi -f ${image}`);
      } catch {}
    });

    execSync('docker compose pull');
    execSync('docker compose up -d');

    res.status(200).send('✅ Deployment completed successfully.');
  } catch (err) {
    console.error(err);
    res.status(500).send('❌ Deployment failed. Check logs for details.');
  }
});

app.listen(8000, () => {
  console.log('🚀 Server listening on port 8000');
});
