// TODO:
//   - test totalCount
//
// Good test example: https://github.com/typeorm/typeorm/blob/master/test/functional/query-builder/brackets/query-builder-brackets.ts
import 'reflect-metadata';
import { Brackets, Connection } from 'typeorm';
import { Container } from 'typedi';

import { createDBConnection } from '../torm';

import { MyBase, MyBaseService } from './tests/entity/MyBase.model';
import {
  Book,
  BookService,
  Author,
  AuthorService,
  Library,
  LibraryService,
  BookMetadata,
  BookMetadataService
} from './tests/entity/Relations.model';

describe('BaseService', () => {
  let connection: Connection;
  let service: MyBaseService;
  beforeAll(async () => {
    connection = await createDBConnection({
      entities: [__dirname + '/tests/entity/*{.js,.ts}']
      // logging: 'all'
    });

    service = Container.get('MyBaseService');
  });
  beforeEach(async () => {
    await connection.synchronize(true);
  });
  afterAll(() => connection.close());

  test('buildFindQuery', async () => {
    await service.createMany(
      [
        { firstName: 'AA', lastName: '01' },
        { firstName: 'BB', lastName: '02' },
        { firstName: 'CC', lastName: '03' },
        { firstName: 'DD', lastName: '04' },
        { firstName: 'EE', lastName: '05' },
        { firstName: 'FF', lastName: '06' },
        { firstName: 'GG', lastName: '07' },
        { firstName: 'HH', lastName: '08' },
        { firstName: 'II', lastName: '09' },
        { firstName: 'JJ', lastName: '10' },
        { firstName: 'KK', lastName: '11' },
        { firstName: 'LL', lastName: '12' },
        { firstName: 'MM', lastName: '13' },
        { firstName: 'NN', lastName: '14' }
      ],
      '1'
    );

    const results = await service
      .buildFindQuery({
        OR: [
          { firstName_contains: 'A' },
          { firstName_contains: 'B' },
          { firstName_contains: 'C' },
          { firstName_contains: 'D' },
          { firstName_contains: 'J' },
          { firstName_contains: 'K' }
        ],
        AND: [{ lastName_contains: '0' }]
      } as any)
      .getMany();

    expect(results.length).toEqual(5);
  });

  describe('findConnection', () => {
    test('returns all objects with no inputs', async () => {
      await service.createMany(
        [
          { firstName: 'AA', lastName: '01' },
          { firstName: 'BB', lastName: '02' },
          { firstName: 'CC', lastName: '03' }
        ],
        '1'
      );

      const results = await service.findConnection();

      expect(results.edges?.length).toEqual(3);
    });

    test('returns a limited number of items if asked', async () => {
      await service.createMany(
        [
          { firstName: 'AA', lastName: '01' },
          { firstName: 'BB', lastName: '02' },
          { firstName: 'CC', lastName: '03' }
        ],
        '1'
      );

      const results = await service.findConnection(
        undefined,
        'firstName_ASC',
        { first: 2 },
        { edges: { node: { firstName: true } } }
      );

      expect(results.edges?.map(edge => edge.node?.firstName)).toEqual(['AA', 'BB']);
    });

    test('returns a limited number of items (using last)', async () => {
      await service.createMany(
        [
          { firstName: 'AA', lastName: '01' },
          { firstName: 'BB', lastName: '02' },
          { firstName: 'CC', lastName: '03' }
        ],
        '1'
      );

      const results = await service.findConnection(
        undefined,
        'firstName_ASC',
        { last: 2 },
        { edges: { node: { firstName: true } } }
      );

      expect(results.edges?.map(edge => edge.node?.firstName)).toEqual(['CC', 'BB']);
    });

    test('query with first, grab cursor and refetch', async () => {
      await service.createMany(
        [
          { firstName: 'AA', lastName: '01' },
          { firstName: 'BB', lastName: '02' },
          { firstName: 'CC', lastName: '03' },
          { firstName: 'DD', lastName: '04' },
          { firstName: 'EE', lastName: '05' },
          { firstName: 'FF', lastName: '06' },
          { firstName: 'GG', lastName: '07' }
        ],
        '1'
      );

      let results = await service.findConnection(
        undefined,
        'firstName_ASC',
        { first: 3 },
        {
          edges: { node: { firstName: true } },
          pageInfo: { endCursor: {}, hasNextPage: {}, hasPreviousPage: {} }
        }
      );

      expect(results.edges?.map(edge => edge.node?.firstName)).toEqual(['AA', 'BB', 'CC']);

      const cursor = results.pageInfo?.endCursor;

      results = await service.findConnection(
        undefined,
        'firstName_ASC',
        { first: 3, after: cursor },
        {
          edges: { node: { firstName: true } },
          pageInfo: { endCursor: {}, hasNextPage: {}, hasPreviousPage: {} }
        }
      );

      expect(results.edges?.map(edge => edge.node?.firstName)).toEqual(['DD', 'EE', 'FF']);
    });

    test('query with last, grab cursor and refetch', async () => {
      await service.createMany(
        [
          { firstName: 'AA', lastName: '01' },
          { firstName: 'BB', lastName: '02' },
          { firstName: 'CC', lastName: '03' },
          { firstName: 'DD', lastName: '04' },
          { firstName: 'EE', lastName: '05' },
          { firstName: 'FF', lastName: '06' },
          { firstName: 'GG', lastName: '07' }
        ],
        '1'
      );

      let results = await service.findConnection(
        undefined,
        'firstName_ASC',
        { last: 3 },
        {
          edges: { node: { firstName: true } },
          pageInfo: { endCursor: {}, hasNextPage: {}, hasPreviousPage: {} }
        }
      );

      expect(results.edges?.map(edge => edge.node?.firstName)).toEqual(['GG', 'FF', 'EE']);

      const cursor = results.pageInfo?.endCursor;

      results = await service.findConnection(
        undefined,
        'firstName_ASC',
        { last: 3, before: cursor },
        {
          edges: { node: { firstName: true } },
          pageInfo: { endCursor: {}, hasNextPage: {}, hasPreviousPage: {} }
        }
      );

      expect(results.edges?.map(edge => edge.node?.firstName)).toEqual(['DD', 'CC', 'BB']);
    });
  });

  test('multiple sorts, query with first, grab cursor and refetch', async () => {
    await service.createMany(
      [
        { registered: true, firstName: 'AA', lastName: '01' },
        { registered: false, firstName: 'BB', lastName: '02' },
        { registered: true, firstName: 'CC', lastName: '03' },
        { registered: false, firstName: 'DD', lastName: '04' },
        { registered: true, firstName: 'EE', lastName: '05' },
        { registered: false, firstName: 'FF', lastName: '06' },
        { registered: true, firstName: 'GG', lastName: '07' }
      ],
      '1'
    );

    let results = await service.findConnection(
      undefined,
      ['registered_ASC', 'firstName_ASC'],
      { first: 4 },
      {
        edges: { node: { firstName: true, registered: true } },
        pageInfo: { endCursor: {}, hasNextPage: {}, hasPreviousPage: {} }
      }
    );

    expect(results.edges?.map(edge => edge.node?.firstName)).toEqual(['BB', 'DD', 'FF', 'AA']);
    expect(results.pageInfo?.hasNextPage).toEqual(true);

    const cursor = results.pageInfo?.endCursor;

    results = await service.findConnection(
      undefined,
      ['registered_ASC', 'firstName_ASC'],
      { first: 3, after: cursor },
      {
        edges: { node: { firstName: true } },
        pageInfo: { endCursor: {}, hasNextPage: {}, hasPreviousPage: {} }
      }
    );

    expect(results.edges?.map(edge => edge.node?.firstName)).toEqual(['CC', 'EE', 'GG']);
  });

  test.skip('fun with brackets', async () => {
    await service.createMany(
      [
        { firstName: 'Timber', lastName: 'Saw' },
        { firstName: 'Pleerock', lastName: 'Pleerock' },
        { firstName: 'Alex', lastName: 'Messer' }
      ],
      '1'
    );

    const bases = await connection
      .createQueryBuilder(MyBase, 'user')
      .where('user.lastName = :lastName0', { lastName0: 'Pleerock' })
      .orWhere(
        new Brackets(qb => {
          qb.where('user.firstName = :firstName1', {
            firstName1: 'Timber'
          }).andWhere('user.lastName = :lastName1', { lastName1: 'Saw' });
        })
      )
      .orWhere(
        new Brackets(qb => {
          qb.where('user.firstName = :firstName2', {
            firstName2: 'Alex'
          }).andWhere('user.lastName = :lastName2', { lastName2: 'Messer' });
        })
      )
      .getMany();

    expect(bases.length).toEqual(3);
  });

  describe('RelationFiltering', () => {
    let bookService: BookService;
    let authorService: AuthorService;
    let libraryService: LibraryService;
    let bookMetadataService: BookMetadataService;

    let books: Book[];
    let authors: Author[];
    let libraries: Library[];
    let bookMetadatas: BookMetadata[];

    beforeAll(async () => {
      bookService = Container.get('BookService');
      authorService = Container.get('AuthorService');
      libraryService = Container.get('LibraryService');
      bookMetadataService = Container.get('BookMetadataService');
    });

    beforeEach(async () => {
      authors = await authorService.createMany(
        [{ name: 'F. Herbert' }, { name: 'J.R.R. Tolkien' }, { name: 'P.K. Dick' }].map(
          (item: Partial<Author>, index) => ((item.id = 'author' + index), item)
        ),
        '1'
      );

      books = await bookService.createMany(
        [
          { name: 'Dune', author: authors[0], starRating: 5 },
          { name: 'The Lord of the Rings', author: authors[1], starRating: 5 },
          { name: 'Do Androids Dream of Electric Sheep?', author: authors[2], starRating: 5 },

          { name: 'Dune Messiah', author: authors[0], starRating: 4 },
          { name: 'The Hobbit', author: authors[1], starRating: 4 },
          { name: 'A Scanner Darkly', author: authors[2], starRating: 5 },

          { name: 'Children of Dune', author: authors[0], starRating: 1 },
          { name: 'The Silmarillion', author: authors[1], starRating: 3 },
          { name: 'The Minority Report', author: authors[2], starRating: 5 }
        ].map((item: Partial<Book>, index) => ((item.id = 'book' + index), item)),
        '1'
      );

      libraries = await libraryService.createMany(
        [
          { name: 'Berlin Library', books },
          { name: 'Prague Library', books: books.slice(0, 6) },
          { name: 'Dallas Library', books: books.slice(0, 3) }
        ].map((item: Partial<Library>, index) => ((item.id = 'library' + index), item)),
        '1'
      );

      bookMetadatas = await bookMetadataService.createMany(
        [
          { ISBN: 'Dummy ISBN 0', book: books[0] },
          { ISBN: 'Dummy ISBN 1', book: books[1] },
          { ISBN: 'Dummy ISBN 2', book: books[2] },
          { ISBN: 'Dummy ISBN 3', book: books[3] },
          { ISBN: 'Dummy ISBN 4', book: books[4] },
          { ISBN: 'Dummy ISBN 5', book: books[5] },
          { ISBN: 'Dummy ISBN 6', book: books[6] },
          { ISBN: 'Dummy ISBN 7', book: books[7] },
          { ISBN: 'Dummy ISBN 8', book: books[8] }
        ].map((item: Partial<BookMetadata>, index) => ((item.id = 'bookMetadata' + index), item)),
        '1'
      );
    });

    test('N:1', async () => {
      // find all books with author's name being X
      const results = await bookService.find({ author: { name: authors[0].name } });

      expect(results.map(item => item.name)).toEqual([books[0].name, books[3].name, books[6].name]);
    });

    test('1:1', async () => {
      // find all books' metadata containing ISBN X
      const results1 = await bookService.find({ bookMetadata: { ISBN: bookMetadatas[1].ISBN } });

      expect(results1.map(item => item.name)).toEqual([books[1].name]);

      // inverse query
      const results2 = await bookMetadataService.find({ book: { name: books[2].name } });

      expect(results2.map(item => item.ISBN)).toEqual([bookMetadatas[2].ISBN]);
    });

    test('1:N', async () => {
      // find authors that have written at least one book called X
      const results1 = await authorService.find({ books_some: { name: books[4].name } });

      expect(results1.map(item => item.name)).toEqual([authors[1].name]);

      // find authors that have only written books with star rating higher than 1
      const results2 = await authorService.find({ books_none: { starRating: 1 } });

      expect(results2.map(item => item.name)).toEqual([authors[1].name, authors[2].name]);

      // find authors that have written only 5 star rated books
      const results3 = await authorService.find({ books_every: { starRating: 5 } });

      expect(results3.map(item => item.name)).toEqual([authors[2].name]);
    });

    test('N:M', async () => {
      // find all books that are present in library X
      const results1 = await bookService.find({ libraries_some: { name: libraries[1].name } });

      expect(results1.map(item => item.name)).toEqual(books.slice(0, 6).map(item => item.name));

      // find all libraries that don't contain 1 star rated book
      const results2 = await libraryService.find({ books_none: { starRating: 1 } });

      expect(results2.map(item => item.name)).toEqual([libraries[1].name, libraries[2].name]);

      // find all libraries that contains only 5 star rated books
      const results3 = await libraryService.find({ books_every: { starRating_eq: 5 } });

      expect(results3.map(item => item.name)).toEqual([libraries[2].name]);
    });
  });
});
