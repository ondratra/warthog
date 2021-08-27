import { Service } from 'typedi';
import { Column, Entity, Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';

import { BaseModel, BaseService } from '../../';
import { ManyToOne, OneToMany } from '../../..';


/*
Book <---> Author (N:1)
Book <---> Library (N:M)
Book <---> BookMetadata (1:1)
Book <---> Page (1:N)
*/


@Entity()
export class Book extends BaseModel {
  @Column({ nullable: true })
  registered?: boolean;

  @Column()
  name!: string;

  @ManyToOne(() => Author, (param: Author) => param.books, {
    skipGraphQLField: true,
    nullable: true,
    cascade: ["insert", "update"],
    modelName: 'Book',
    relModelName: 'Author',
    propertyName: 'author',
  })
  author!: Author;
}

@Entity()
export class Author extends BaseModel {
  @Column()
  name!: string;

  @OneToMany(() => Book, (param: Book) => param.author, {
    cascade: ["insert", "update"],
    modelName: 'Channel',
    relModelName: 'Video',
    propertyName: 'videos',
  })
  books?: Book[];
}

@Entity()
export class Library extends BaseModel {
  @Column()
  name!: string;

}

@Entity()
export class BookMetadata extends BaseModel {
  @Column()
  ISBN!: string;


}

@Entity()
export class Page extends BaseModel {
  @Column()
  name!: string;


}

@Service('BookService')
export class BookService extends BaseService<Book> {
  constructor(@InjectRepository(Book) protected readonly repository: Repository<Book>) {
    super(Book, repository);
  }
}
