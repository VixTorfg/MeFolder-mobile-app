import { ImageSource } from "expo-image";

/**
 * Cada paso del tutorial: una captura + su texto explicativo.
 */
export interface TutorialStep {
  /** Título corto de la acción que se muestra. */
  title: string;
  /** Descripción de qué hace el usuario / qué verá. */
  description: string;
  /** Captura asociada al paso. La rellenas tú con require(...). */
  image: ImageSource | number;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: "Inicio",
    description:
      "Aquí ves la información de inicio. Muestra etiquetas de importancia, álbumes e información de almacenamiento. Cada uno muestra una portada distinta cada día. Toca cualquiera para abrirlo.",
    image: require("../../../assets/images/tutorial/1.jpeg"),
  },
  {
    title: "Navega por la librería",
    description:
      "Aquí puedes explorar tu librería, incluir nuevos archivos y organizar tus carpetas, siempre bajo una estructura de árbol.",
    image: require("../../../assets/images/tutorial/2.jpeg"),
  },
  {
    title: "Importar archivos",
    description:
      "Púlsa en el icono de suma en la parte superior para importar nuevos archivos a tu librería. Después, selecciona que quieres crear, elige entre carpeta y archivos. En archivos podrás importar desde múltiples fuentes, como tu galería, o incluso realizar una foto o vídeo.",
    image: require("../../../assets/images/tutorial/3.jpeg"),
  },
  {
    title: "Añade etiquetas",
    description:
      "Una vez seleccionado los archivos, cambiáles el nombre o añade etiquetas para organizarlos. También se pueden añadir directamente desde las propieddes de cada archivo. ",
    image: require("../../../assets/images/tutorial/4.jpeg"),
  },
  {
    title: "Menu de acciones",
    description:
      "Aquí puedes acceder a diversas acciones para los archivos seleccionados, como cortar, copiar, eliminar o compartir. Accede pulsando dos veces en una carpeta o archivo.",
    image: require("../../../assets/images/tutorial/5.jpeg"),
  },
  {
    title: "Menus de ver más opciones",
    description:
      "Clica en los tres puntos, en las flechas o en el icono de ojo para acceder a más opciones, como ordenar, filtrar o cambiar la vista de tu librería. También puedes acceder a la configuracion de la carpeta padre o a los ajustes de la aplicación.",
    image: require("../../../assets/images/tutorial/6.jpeg"),
  },
  {
    title: "Ajustes y opciones avanzadas",
    description:
      "Modifica el tema de la aplicación, reabre el tutorial o gestiona el almacenamiento. Accede a opciones avanzadas para personalizar tu experiencia.",
    image: require("../../../assets/images/tutorial/7.jpeg"),
  },
  {
    title: "Etiquetas",
    description:
      "Aquí puedes gestionar y organizar tus etiquetas. Añade favoritos, gestiona prioridades o crea nuevos álbumes.",
    image: require("../../../assets/images/tutorial/8.jpeg"),
  },
  {
    title: "Crea etiquetas",
    description:
      "Aquí puedes crear nuevas etiquetas para organizar tus archivos. Clica en el icono de 'Importar álbum' para importar y crear un nuevo álbum. ¡Así puedes compartir álbumes entre amigos!",
    image: require("../../../assets/images/tutorial/9.jpeg"),
  },
  {
    title: "Personaliza tus colores",
    description:
      "Crea nuevos colores para tus etiquetas y carpetas, podrás usarlos a lo largo de la aplicación. Personaliza tu experiencia y haz que tu librería sea única.",
    image: require("../../../assets/images/tutorial/10.jpeg"),
  },
  {
    title: "Crea álbumes o etiquetas con prioridad",
    description:
      "Directamente desde la creación de etiquetas, selecciona álbum para crear uno nuevo o crea una etiqueta con diferentes prioridades para gestionar tu trabajo.",
    image: require("../../../assets/images/tutorial/11.jpeg"),
  },
  {
    title: "Álbumes",
    description:
      "Los álbumes te permiten gestionar y organizar fotos y vídeos en un único lugar. Crea álbumes para compartir con amigos o para organizar tus recuerdos de forma personalizada.",
    image: require("../../../assets/images/tutorial/12.jpeg"),
  },
  {
    title: "Álbumes",
    description:
      "Pellizca o amplía para acercar o alejar las fotos dentro de un álbum. El álbum del sistema almacena automáticamente todas tus fotos y vídeos, pero también puedes crear álbumes personalizados para organizar tus recuerdos de forma única.",
    image: require("../../../assets/images/tutorial/13.jpeg"),
  },
  {
    title: "Papelera de reciclaje",
    description:
      "Aquí puedes gestionar los archivos eliminados. Restaura archivos si los eliminaste por error o vacía la papelera para liberar espacio.",
    image: require("../../../assets/images/tutorial/14.jpeg"),
  },
];
