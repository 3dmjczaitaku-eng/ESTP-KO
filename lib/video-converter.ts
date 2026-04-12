import { execFile } from 'child_process'

function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile('ffmpeg', args, (err) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

export async function convertToWebm(inputPath: string, outputPath: string): Promise<void> {
  await runFfmpeg([
    '-i', inputPath,
    '-codec:v', 'libvpx-vp9',
    '-crf', '28',
    '-b:v', '0',
    '-an',
    '-y',
    outputPath,
  ])
}

export async function extractPoster(videoPath: string, outputPath: string): Promise<void> {
  await runFfmpeg([
    '-i', videoPath,
    '-frames:v', '1',
    '-q:v', '2',
    '-y',
    outputPath,
  ])
}
