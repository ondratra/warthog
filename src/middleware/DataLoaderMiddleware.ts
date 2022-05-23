import * as DataLoader from 'dataloader';
import { MiddlewareInterface, NextFn, ResolverData } from 'type-graphql';
import { Service } from 'typedi';

import { BaseContext } from '../core';

interface Deleteable {
  deletedAt?: string;
}

@Service()
export class DataLoaderMiddleware implements MiddlewareInterface<BaseContext> {
  async use({ context }: ResolverData<BaseContext>, next: NextFn) {
    if (!context.dataLoader.initialized) {
      context.dataLoader = {
        initialized: true,
        loaders: {}
      };

      const loaders = context.dataLoader.loaders;

      context.connection.entityMetadatas.forEach(entityMetadata => {
        const resolverName = entityMetadata.targetName;
        if (!resolverName) {
          return;
        }

        if (!loaders[resolverName]) {
          loaders[resolverName] = {};
        }

        entityMetadata.relations.forEach(relation => {
          // define data loader for this method if it was not defined yet
          if (!loaders[resolverName][relation.propertyName]) {
            loaders[resolverName][relation.propertyName] = new DataLoader((entities: any[]) => {
              if (Array.isArray(entities) && entities[0] && Array.isArray(entities[0])) {
                throw new Error('You must flatten arrays of arrays of entities');
              }
              return Promise.all(
                entities.map(entity => context.connection.relationLoader.load(relation, entity))
              ).then(function(results) {
                return results.map(function(related) {
                  return relation.isManyToOne || relation.isOneToOne ? related[0] : related;
                });
              });
            });
          }
        });
      });
    }
    return next();
  }
}
