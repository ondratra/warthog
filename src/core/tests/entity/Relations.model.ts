import { Service } from 'typedi';
import { Column, Entity, JoinTable, Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';

import { BaseModel, BaseService } from '../../';
import { ManyToMany, ManyToOne, OneToMany, OneToOne, OneToOneJoin } from '../../..';

/*
Book <---> Author (N:1)
Book <---> Library (N:M)
Book <---> BookMetadata (1:1)
*/

@Entity()
export class Book extends BaseModel {
  @Column({ nullable: true })
  registered?: boolean;

  @Column()
  name!: string;

  @Column()
  starRating!: number;

  @ManyToOne(() => Author, (param: Author) => param.books, {
    skipGraphQLField: true,
    nullable: true,
    modelName: 'Book',
    relModelName: 'Author',
    propertyName: 'author',
  })
  author!: Author;

  @ManyToMany(() => Library, (param: Library) => param.books, {
    modelName: 'Book',
    relModelName: 'Library',
    propertyName: 'libraries',
  })
  @JoinTable({
    name: 'book_in_library',
    joinColumn: { name: 'book_id' },
    inverseJoinColumn: { name: 'library_id' },
  })
  libraries!: Library[];

  @OneToOneJoin(() => BookMetadata, (param: BookMetadata) => param.book, {
    nullable: true,
    modelName: 'Book',
    relModelName: 'BookMetadata',
    propertyName: 'bookMetadata',
  })
  bookMetadata!: BookMetadata;
}

@Entity()
export class Author extends BaseModel {
  @Column()
  name!: string;

  @OneToMany(() => Book, (param: Book) => param.author, {
    cascade: ["insert", "update"],
    modelName: 'Author',
    relModelName: 'Book',
    propertyName: 'books',
  })
  books!: Book[];
}

@Entity()
export class Library extends BaseModel {
  @Column()
  name!: string;

  @ManyToMany(() => Book, (param: Book) => param.libraries, {
    modelName: 'Library',
    relModelName: 'Book',
    propertyName: 'books',
  })
  books!: Book[];
}

@Entity()
export class BookMetadata extends BaseModel {
  @Column()
  ISBN!: string;

  @OneToOne(() => Book, (param: Book) => param.bookMetadata, {
    modelName: 'Video',
    relModelName: 'Book',
    propertyName: 'book',
  })
  book!: Book;
}

@Service('BookService')
export class BookService extends BaseService<Book> {
  constructor(@InjectRepository(Book) protected readonly repository: Repository<Book>) {
    super(Book, repository);
  }
}

@Service('AuthorService')
export class AuthorService extends BaseService<Author> {
  constructor(@InjectRepository(Author) protected readonly repository: Repository<Author>) {
    super(Author, repository);
  }
}

@Service('LibraryService')
export class LibraryService extends BaseService<Library> {
  constructor(@InjectRepository(Library) protected readonly repository: Repository<Library>) {
    super(Library, repository);
  }
}

@Service('BookMetadataService')
export class BookMetadataService extends BaseService<BookMetadata> {
  constructor(@InjectRepository(BookMetadata) protected readonly repository: Repository<BookMetadata>) {
    super(BookMetadata, repository);
  }
}
