/**
 * Ejemplos de uso del FileService MVP
 * Demostraciones de operaciones básicas para entender la arquitectura
 */

import { FileService } from './FileService';
import { Database } from '../database/sqlite/Database';

// Ejemplo de inicialización y uso básico del FileService
export class FileServiceExample {
  private fileService: FileService;

  constructor() {
    this.fileService = new FileService();
  }

  /** Ejemplo 1: Crear archivo básico */
  async createFileExample() {
    // Inicializar DB primero
    await Database.getInstance().initialize();

    const newFile = await this.fileService.createFile({
      name: 'mi-documento.pdf',
      originalName: 'mi-documento.pdf',
      extension: 'pdf',
      folderId: 'folder_12345', // opcional - si no se especifica va a la raíz
      metadata: {
        size: 1024000,
        mimeType: 'application/pdf'
      }
    });

    console.log('Archivo creado:', newFile.name);
    console.log('ID del archivo:', newFile.id);
  }

  /** Ejemplo 2: Obtener archivos de una carpeta */
  async getFilesInFolderExample() {
    // Obtener archivos de una carpeta específica
    const filesInFolder = await this.fileService.getFilesInFolder('folder_12345');
    console.log(`Archivos en la carpeta: ${filesInFolder.length}`);
    
    // Obtener archivos de la raíz (sin carpeta)
    const rootFiles = await this.fileService.getFilesInFolder();
    console.log(`Archivos en la raíz: ${rootFiles.length}`);
    
    // Mostrar lista de archivos
    filesInFolder.forEach(file => {
      console.log(`- ${file.name} (${file.metadata?.size || 0} bytes)`);
    });
  }

  /** Ejemplo 3: Mover archivo entre carpetas */
  async moveFileExample() {
    const fileId = 'file_12345';
    const targetFolderId = 'folder_67890';
    
    try {
      const movedFile = await this.fileService.moveFile(fileId, targetFolderId);
      console.log(`Archivo movido exitosamente a la carpeta: ${movedFile.folderId}`);
    } catch (error) {
      console.error('Error al mover archivo:', error);
    }
  }

  /** Ejemplo 4: Gestión básica de tags */
  async manageTagsExample() {
    const fileId = 'file_12345';
    const tagIds = ['tag_importante', 'tag_trabajo'];
    
    // Añadir tags a un archivo
    await this.fileService.addTagsToFile(fileId, tagIds);
    console.log('Tags añadidos al archivo');
    
    // Ver los tags del archivo
    const fileTags = await this.fileService.getFileTags(fileId);
    console.log('Tags del archivo:', fileTags);
    
    // Remover un tag específico
    await this.fileService.removeTagsFromFile(fileId, ['tag_trabajo']);
    console.log('Tag removido');
  }

  /** Ejemplo 5: Eliminar archivo (soft delete) */
  async deleteFileExample() {
    const fileId = 'file_12345';
    
    try {
      const deleted = await this.fileService.deleteFile(fileId);
      if (deleted) {
        console.log('Archivo eliminado correctamente');
      }
    } catch (error) {
      console.error('Error al eliminar archivo:', error);
    }
  }

  /** Ejemplo completo: Flujo típico de trabajo */
  async completeWorkflowExample() {
    console.log('=== Flujo de trabajo completo ===');
    
    try {
      // 1. Crear archivo
      const newFile = await this.fileService.createFile({
        name: 'reporte-proyecto.docx',
        originalName: 'reporte-proyecto.docx',
        extension: 'docx',
        metadata: {
          size: 245760,
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        }
      });
      console.log('✅ Archivo creado:', newFile.name);
      
      // 2. Añadir tags
      await this.fileService.addTagsToFile(newFile.id, ['tag_reportes', 'tag_proyecto']);
      console.log('✅ Tags añadidos');
      
      // 3. Mover a carpeta de trabajo
      await this.fileService.moveFile(newFile.id, 'folder_trabajo');
      console.log('✅ Archivo movido a carpeta de trabajo');
      
      // 4. Verificar el archivo
      const retrievedFile = await this.fileService.getFile(newFile.id);
      console.log('✅ Archivo verificado:', retrievedFile.name);
      
      // 5. Ver archivos en la carpeta
      const folderFiles = await this.fileService.getFilesInFolder('folder_trabajo');
      console.log(`✅ Total de archivos en la carpeta: ${folderFiles.length}`);
      
    } catch (error) {
      console.error('❌ Error en el flujo:', error);
    }
  }
}

// Utilidad para ejecutar ejemplos
export async function runFileServiceExamples() {
  const examples = new FileServiceExample();
  
  console.log('Ejecutando ejemplos del FileService...\n');
  
  // Ejecutar ejemplos individuales
  await examples.createFileExample();
  await examples.getFilesInFolderExample();
  await examples.moveFileExample();
  await examples.manageTagsExample();
  await examples.deleteFileExample();
  
  // Ejecutar flujo completo
  await examples.completeWorkflowExample();
  
  console.log('\n✅ Todos los ejemplos completados');
}
