import { FileModel, FolderModel } from "@/models";
import { FolderSortBy, FolderSortOrder } from "@/types/entities/folder";

export const sortItems = (items: (FileModel | FolderModel)[], orderBy: FolderSortBy, sortValue: FolderSortOrder) => {
    const files = items.filter(item => item instanceof FileModel);
    const folders = items.filter(item => item instanceof FolderModel);

    const sortedFiles = files.sort((a, b) => {
        let compare = 0;
        if (orderBy === 'name') {
            compare = a.name.localeCompare(b.name);
        } else if (orderBy === 'date' || orderBy === 'type') {
            compare = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        } else{
            compare = a.size - b.size;
        } 
        return sortValue === 'asc' ? compare : -compare;
    });

    const sortedFolders = folders.sort((a, b) => {
        let compare = 0;
        if (orderBy === 'name') {
            compare = a.name.localeCompare(b.name);
        } else if (orderBy === 'date' || orderBy === 'size') {
            compare = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        } else {
            compare = a.type.localeCompare(b.type);
        }

        return sortValue === 'asc' ? compare : -compare;
    });

    return [...sortedFolders, ...sortedFiles];

}
