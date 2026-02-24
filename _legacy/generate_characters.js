
import { Jimp } from 'jimp';

const CHARACTERS = [
    { name: 'custom_mario', path: 'C:/Users/user/.gemini/antigravity/brain/22755548-4d8f-49ed-b908-23d79e01a379/uploaded_image_0_1768216670312.jpg', color: 0xFF0000FF }, // Red
    { name: 'custom_luigi', path: 'C:/Users/user/.gemini/antigravity/brain/22755548-4d8f-49ed-b908-23d79e01a379/uploaded_image_1_1768216670312.jpg', color: 0x00FF00FF }, // Green
    { name: 'custom_peach', path: 'C:/Users/user/.gemini/antigravity/brain/22755548-4d8f-49ed-b908-23d79e01a379/uploaded_image_2_1768216670312.jpg', color: 0xFFC0CBFF }  // Pink
];

async function generate() {
    for (const char of CHARACTERS) {
        console.log(`Processing ${char.name}...`);
        try {
            const face = await Jimp.read(char.path);
            // Center crop and resize
            // Assuming face is roughly centered.
            // Crop square from center
            const minDim = Math.min(face.width, face.height);
            face.crop({
                x: (face.width - minDim) / 2,
                y: (face.height - minDim) / 2,
                w: minDim,
                h: minDim
            });
            face.resize({ w: 28, h: 28 });

            // Create sprite sheet
            const sheet = new Jimp({ width: 128, height: 32, color: 0x00000000 });

            // Draw 4 frames
            for (let i = 0; i < 4; i++) {
                const offsetX = i * 32;

                // Draw Body (Color)
                // Torso
                for (let y = 20; y < 28; y++) {
                    for (let x = 10; x < 22; x++) {
                        sheet.setPixelColor(char.color, offsetX + x, y);
                    }
                }

                // Legs (Black or Darker version of color? Let's use Black 0x000000FF or just same color for simplicity)
                // Using black for stick legs
                const legColor = 0x000000FF;

                // Frame logic
                if (i === 0) { // Idle
                    // Left Leg
                    for (let y = 28; y < 32; y++) sheet.setPixelColor(legColor, offsetX + 11, y);
                    sheet.setPixelColor(legColor, offsetX + 10, 31); // foot
                    // Right Leg
                    for (let y = 28; y < 32; y++) sheet.setPixelColor(legColor, offsetX + 20, y);
                    sheet.setPixelColor(legColor, offsetX + 21, 31); // foot
                } else if (i === 1) { // Walk 1
                    // Left forward
                    for (let y = 28; y < 32; y++) sheet.setPixelColor(legColor, offsetX + 11 - (y - 28), y);
                    // Right back
                    for (let y = 28; y < 32; y++) sheet.setPixelColor(legColor, offsetX + 20 + (y - 28), y);
                } else if (i === 2) { // Walk 2
                    // Left back
                    for (let y = 28; y < 32; y++) sheet.setPixelColor(legColor, offsetX + 11 + (y - 28), y);
                    // Right forward
                    for (let y = 28; y < 32; y++) sheet.setPixelColor(legColor, offsetX + 20 - (y - 28), y);
                } else if (i === 3) { // Jump
                    // Knees up
                    sheet.setPixelColor(legColor, offsetX + 10, 28);
                    sheet.setPixelColor(legColor, offsetX + 10, 29);
                    sheet.setPixelColor(legColor, offsetX + 11, 29); // foot

                    sheet.setPixelColor(legColor, offsetX + 21, 28);
                    sheet.setPixelColor(legColor, offsetX + 21, 29);
                    sheet.setPixelColor(legColor, offsetX + 22, 29); // foot
                }

                // Arms (Stick)
                // Left
                sheet.setPixelColor(legColor, offsetX + 9, 21);
                sheet.setPixelColor(legColor, offsetX + 8, 22);
                sheet.setPixelColor(legColor, offsetX + 8, 23);
                // Right
                sheet.setPixelColor(legColor, offsetX + 22, 21);
                sheet.setPixelColor(legColor, offsetX + 23, 22);
                sheet.setPixelColor(legColor, offsetX + 23, 23);

                // Composite Face
                sheet.composite(face, offsetX + 2, 0); // Top centered (32 - 28) / 2 = 2
            }

            await sheet.write(`public/assets/${char.name}.png`);
            console.log(`Saved public/assets/${char.name}.png`);

        } catch (e) {
            console.error(`Error processing ${char.name}:`, e);
        }
    }
}

generate();
