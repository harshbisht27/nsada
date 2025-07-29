let detector, video, canvas, ctx;
let specsImg;

async function setup() {
  video = document.getElementById('video');
  canvas = document.getElementById('output');
  ctx = canvas.getContext('2d');

  specsImg = new Image();
  specsImg.src = 'images/spects.png';

  await initCamera();
  detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet);
  requestAnimationFrame(detectPose);
}

async function initCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: 800, height: 500 }
  });
  video.srcObject = stream;
  await video.play();
}

async function detectPose() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const poses = await detector.estimatePoses(video);
  if (poses.length > 0) {
    const keypoints = poses[0].keypoints;
    drawKeypoints(keypoints);
    drawSkeleton(keypoints);
    drawSpecs(keypoints);
  }

  requestAnimationFrame(detectPose);
}

function drawKeypoints(keypoints) {
  ctx.fillStyle = '#00ff88';
  for (let i = 0; i < keypoints.length; i++) {
    const k = keypoints[i];
    if (k.score > 0.4) {
      ctx.beginPath();
      ctx.arc(k.x, k.y, 4, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
}

function drawSkeleton(keypoints) {
  ctx.strokeStyle = '#ffffffcc';
  ctx.lineWidth = 1.5;
  const adj = poseDetection.util.getAdjacentPairs(poseDetection.SupportedModels.MoveNet);

  adj.forEach(([i, j]) => {
    const kp1 = keypoints[i];
    const kp2 = keypoints[j];
    if (kp1.score > 0.4 && kp2.score > 0.4) {
      ctx.beginPath();
      ctx.moveTo(kp1.x, kp1.y);
      ctx.lineTo(kp2.x, kp2.y);
      ctx.stroke();
    }
  });
}

function drawSpecs(keypoints) {
  const leftEye = keypoints[1];
  const rightEye = keypoints[2];

  if (leftEye.score > 0.5 && rightEye.score > 0.5) {
    const centerX = (leftEye.x + rightEye.x) / 2;
    const centerY = (leftEye.y + rightEye.y) / 2;
    const eyeDist = Math.hypot(rightEye.x - leftEye.x, rightEye.y - leftEye.y);

    const width = eyeDist * 2.0;
    const height = eyeDist * 0.7;

    ctx.drawImage(specsImg, centerX - width / 2, centerY - height / 2, width, height);
  }
}

setup();
