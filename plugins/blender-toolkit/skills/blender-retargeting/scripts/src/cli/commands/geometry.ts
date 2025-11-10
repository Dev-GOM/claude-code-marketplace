/**
 * Geometry Commands
 * Blender 도형 생성 및 메쉬 편집 명령
 */

import { Command } from 'commander';
import { BlenderClient } from '../../blender/client';
import { logger } from '../../utils/logger';

const client = new BlenderClient();

export function registerGeometryCommands(program: Command) {
  // Create Cube
  program
    .command('create-cube')
    .description('Create a cube primitive')
    .option('-x, --x <number>', 'X position', parseFloat, 0)
    .option('-y, --y <number>', 'Y position', parseFloat, 0)
    .option('-z, --z <number>', 'Z position', parseFloat, 0)
    .option('-s, --size <number>', 'Cube size', parseFloat, 2.0)
    .option('-n, --name <string>', 'Object name')
    .option('-p, --port <number>', 'Blender WebSocket port', parseInt, 9400)
    .action(async (options) => {
      try {
        await client.connect(options.port);

        const result: any = await client.sendCommand('Geometry.createCube', {
          location: [options.x, options.y, options.z],
          size: options.size,
          name: options.name
        });

        console.log('✅ Cube created successfully:');
        console.log(`   Name: ${result.name}`);
        console.log(`   Location: [${result.location.join(', ')}]`);
        console.log(`   Vertices: ${result.vertices}`);
        console.log(`   Faces: ${result.faces}`);

        await client.disconnect();
      } catch (error) {
        logger.error('Failed to create cube:', error);
        console.error('❌ Error:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // Create Sphere
  program
    .command('create-sphere')
    .description('Create a sphere primitive')
    .option('-x, --x <number>', 'X position', parseFloat, 0)
    .option('-y, --y <number>', 'Y position', parseFloat, 0)
    .option('-z, --z <number>', 'Z position', parseFloat, 0)
    .option('-r, --radius <number>', 'Sphere radius', parseFloat, 1.0)
    .option('--segments <number>', 'Number of segments', parseInt, 32)
    .option('--rings <number>', 'Number of rings', parseInt, 16)
    .option('-n, --name <string>', 'Object name')
    .option('-p, --port <number>', 'Blender WebSocket port', parseInt, 9400)
    .action(async (options) => {
      try {
        await client.connect(options.port);

        const result: any = await client.sendCommand('Geometry.createSphere', {
          location: [options.x, options.y, options.z],
          radius: options.radius,
          segments: options.segments,
          ringCount: options.rings,
          name: options.name
        });

        console.log('✅ Sphere created successfully:');
        console.log(`   Name: ${result.name}`);
        console.log(`   Location: [${result.location.join(', ')}]`);
        console.log(`   Vertices: ${result.vertices}`);
        console.log(`   Faces: ${result.faces}`);

        await client.disconnect();
      } catch (error) {
        logger.error('Failed to create sphere:', error);
        console.error('❌ Error:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // Create Cylinder
  program
    .command('create-cylinder')
    .description('Create a cylinder primitive')
    .option('-x, --x <number>', 'X position', parseFloat, 0)
    .option('-y, --y <number>', 'Y position', parseFloat, 0)
    .option('-z, --z <number>', 'Z position', parseFloat, 0)
    .option('-r, --radius <number>', 'Cylinder radius', parseFloat, 1.0)
    .option('-d, --depth <number>', 'Cylinder height/depth', parseFloat, 2.0)
    .option('--vertices <number>', 'Number of vertices', parseInt, 32)
    .option('-n, --name <string>', 'Object name')
    .option('-p, --port <number>', 'Blender WebSocket port', parseInt, 9400)
    .action(async (options) => {
      try {
        await client.connect(options.port);

        const result: any = await client.sendCommand('Geometry.createCylinder', {
          location: [options.x, options.y, options.z],
          radius: options.radius,
          depth: options.depth,
          vertices: options.vertices,
          name: options.name
        });

        console.log('✅ Cylinder created successfully:');
        console.log(`   Name: ${result.name}`);
        console.log(`   Location: [${result.location.join(', ')}]`);
        console.log(`   Vertices: ${result.vertices}`);
        console.log(`   Faces: ${result.faces}`);

        await client.disconnect();
      } catch (error) {
        logger.error('Failed to create cylinder:', error);
        console.error('❌ Error:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // Create Plane
  program
    .command('create-plane')
    .description('Create a plane primitive')
    .option('-x, --x <number>', 'X position', parseFloat, 0)
    .option('-y, --y <number>', 'Y position', parseFloat, 0)
    .option('-z, --z <number>', 'Z position', parseFloat, 0)
    .option('-s, --size <number>', 'Plane size', parseFloat, 2.0)
    .option('-n, --name <string>', 'Object name')
    .option('-p, --port <number>', 'Blender WebSocket port', parseInt, 9400)
    .action(async (options) => {
      try {
        await client.connect(options.port);

        const result: any = await client.sendCommand('Geometry.createPlane', {
          location: [options.x, options.y, options.z],
          size: options.size,
          name: options.name
        });

        console.log('✅ Plane created successfully:');
        console.log(`   Name: ${result.name}`);
        console.log(`   Location: [${result.location.join(', ')}]`);
        console.log(`   Vertices: ${result.vertices}`);
        console.log(`   Faces: ${result.faces}`);

        await client.disconnect();
      } catch (error) {
        logger.error('Failed to create plane:', error);
        console.error('❌ Error:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // Create Cone
  program
    .command('create-cone')
    .description('Create a cone primitive')
    .option('-x, --x <number>', 'X position', parseFloat, 0)
    .option('-y, --y <number>', 'Y position', parseFloat, 0)
    .option('-z, --z <number>', 'Z position', parseFloat, 0)
    .option('-r, --radius <number>', 'Cone base radius', parseFloat, 1.0)
    .option('-d, --depth <number>', 'Cone height/depth', parseFloat, 2.0)
    .option('--vertices <number>', 'Number of vertices', parseInt, 32)
    .option('-n, --name <string>', 'Object name')
    .option('-p, --port <number>', 'Blender WebSocket port', parseInt, 9400)
    .action(async (options) => {
      try {
        await client.connect(options.port);

        const result: any = await client.sendCommand('Geometry.createCone', {
          location: [options.x, options.y, options.z],
          radius1: options.radius,
          depth: options.depth,
          vertices: options.vertices,
          name: options.name
        });

        console.log('✅ Cone created successfully:');
        console.log(`   Name: ${result.name}`);
        console.log(`   Location: [${result.location.join(', ')}]`);
        console.log(`   Vertices: ${result.vertices}`);
        console.log(`   Faces: ${result.faces}`);

        await client.disconnect();
      } catch (error) {
        logger.error('Failed to create cone:', error);
        console.error('❌ Error:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // Create Torus
  program
    .command('create-torus')
    .description('Create a torus primitive')
    .option('-x, --x <number>', 'X position', parseFloat, 0)
    .option('-y, --y <number>', 'Y position', parseFloat, 0)
    .option('-z, --z <number>', 'Z position', parseFloat, 0)
    .option('--major-radius <number>', 'Major radius', parseFloat, 1.0)
    .option('--minor-radius <number>', 'Minor radius (tube thickness)', parseFloat, 0.25)
    .option('--major-segments <number>', 'Major segments', parseInt, 48)
    .option('--minor-segments <number>', 'Minor segments', parseInt, 12)
    .option('-n, --name <string>', 'Object name')
    .option('-p, --port <number>', 'Blender WebSocket port', parseInt, 9400)
    .action(async (options) => {
      try {
        await client.connect(options.port);

        const result: any = await client.sendCommand('Geometry.createTorus', {
          location: [options.x, options.y, options.z],
          majorRadius: options.majorRadius,
          minorRadius: options.minorRadius,
          majorSegments: options.majorSegments,
          minorSegments: options.minorSegments,
          name: options.name
        });

        console.log('✅ Torus created successfully:');
        console.log(`   Name: ${result.name}`);
        console.log(`   Location: [${result.location.join(', ')}]`);
        console.log(`   Vertices: ${result.vertices}`);
        console.log(`   Faces: ${result.faces}`);

        await client.disconnect();
      } catch (error) {
        logger.error('Failed to create torus:', error);
        console.error('❌ Error:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // Subdivide Mesh
  program
    .command('subdivide')
    .description('Subdivide a mesh object')
    .requiredOption('-n, --name <string>', 'Object name')
    .option('-c, --cuts <number>', 'Number of subdivision cuts', parseInt, 1)
    .option('-p, --port <number>', 'Blender WebSocket port', parseInt, 9400)
    .action(async (options) => {
      try {
        await client.connect(options.port);

        const result: any = await client.sendCommand('Geometry.subdivideMesh', {
          name: options.name,
          cuts: options.cuts
        });

        console.log('✅ Mesh subdivided successfully:');
        console.log(`   Name: ${result.name}`);
        console.log(`   Vertices: ${result.vertices}`);
        console.log(`   Edges: ${result.edges}`);
        console.log(`   Faces: ${result.faces}`);

        await client.disconnect();
      } catch (error) {
        logger.error('Failed to subdivide mesh:', error);
        console.error('❌ Error:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // Get Vertices
  program
    .command('get-vertices')
    .description('Get vertices information of an object')
    .requiredOption('-n, --name <string>', 'Object name')
    .option('-p, --port <number>', 'Blender WebSocket port', parseInt, 9400)
    .action(async (options) => {
      try {
        await client.connect(options.port);

        const vertices: any = await client.sendCommand('Geometry.getVertices', {
          name: options.name
        });

        console.log(`✅ Found ${vertices.length} vertices in "${options.name}":`);

        if (vertices.length <= 10) {
          // Show all vertices if 10 or less
          vertices.forEach((v: any) => {
            console.log(`   Vertex ${v.index}: [${v.co.map((n: number) => n.toFixed(3)).join(', ')}]`);
          });
        } else {
          // Show first 5 and last 5 if more than 10
          for (let i = 0; i < 5; i++) {
            const v = vertices[i];
            console.log(`   Vertex ${v.index}: [${v.co.map((n: number) => n.toFixed(3)).join(', ')}]`);
          }
          console.log(`   ... (${vertices.length - 10} more vertices)`);
          for (let i = vertices.length - 5; i < vertices.length; i++) {
            const v = vertices[i];
            console.log(`   Vertex ${v.index}: [${v.co.map((n: number) => n.toFixed(3)).join(', ')}]`);
          }
        }

        await client.disconnect();
      } catch (error) {
        logger.error('Failed to get vertices:', error);
        console.error('❌ Error:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // Move Vertex
  program
    .command('move-vertex')
    .description('Move a specific vertex to a new position')
    .requiredOption('-n, --name <string>', 'Object name')
    .requiredOption('-i, --index <number>', 'Vertex index', parseInt)
    .requiredOption('-x, --x <number>', 'New X position', parseFloat)
    .requiredOption('-y, --y <number>', 'New Y position', parseFloat)
    .requiredOption('-z, --z <number>', 'New Z position', parseFloat)
    .option('-p, --port <number>', 'Blender WebSocket port', parseInt, 9400)
    .action(async (options) => {
      try {
        await client.connect(options.port);

        const result: any = await client.sendCommand('Geometry.moveVertex', {
          objectName: options.name,
          vertexIndex: options.index,
          newPosition: [options.x, options.y, options.z]
        });

        console.log('✅ Vertex moved successfully:');
        console.log(`   Object: ${result.object}`);
        console.log(`   Vertex ${result.vertex_index}: [${result.position.map((n: number) => n.toFixed(3)).join(', ')}]`);

        await client.disconnect();
      } catch (error) {
        logger.error('Failed to move vertex:', error);
        console.error('❌ Error:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });
}
