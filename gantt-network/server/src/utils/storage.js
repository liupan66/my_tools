const fs = require('fs');
const path = require('path');

class Storage {
  constructor(filePath) {
    this.filePath = path.join(__dirname, '../', filePath);
    this.ensureFileExists();
  }

  ensureFileExists() {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, '[]', 'utf8');
    }
  }

  read() {
    try {
      const data = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to read file:', error);
      return [];
    }
  }

  write(data) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error('Failed to write file:', error);
      return false;
    }
  }

  findById(id) {
    const items = this.read();
    return items.find(item => item.id === id);
  }

  create(item) {
    const items = this.read();
    const newItem = {
      id: Date.now().toString(),
      ...item,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    items.push(newItem);
    this.write(items);
    return newItem;
  }

  update(id, updates) {
    const items = this.read();
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return null;

    items[index] = {
      ...items[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.write(items);
    return items[index];
  }

  delete(id) {
    const items = this.read();
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return false;

    items.splice(index, 1);
    this.write(items);
    return true;
  }
}

module.exports = Storage;
