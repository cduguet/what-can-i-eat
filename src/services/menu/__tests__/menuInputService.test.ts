import { parseMenuText } from '../menuInputService';

describe('menuInputService', () => {
  describe('parseMenuText', () => {
    it('parses lines into menu items with name and description', () => {
      const text = `
      STARTERS
      Caesar Salad - Romaine, croutons, parmesan
      Margherita Pizza: tomatoes, mozzarella, basil
      • Vegan Burger – plant patty, lettuce, tomato
      `;
      const items = parseMenuText(text);
      expect(items.length).toBeGreaterThanOrEqual(3);
      const names = items.map(i => i.name.toLowerCase());
      expect(names).toEqual(expect.arrayContaining(['caesar salad', 'margherita pizza', 'vegan burger']));
      const caesar = items.find(i => i.name.toLowerCase() === 'caesar salad')!;
      expect(caesar.description?.toLowerCase()).toContain('romaine');
    });

    it('skips duplicate lines and section headers', () => {
      const text = `
      ENTREES
      Pasta
      Pasta - with tomato sauce
      `;
      const items = parseMenuText(text);
      expect(items.length).toBe(1);
      expect(items[0].name).toBe('Pasta');
    });
  });
});

