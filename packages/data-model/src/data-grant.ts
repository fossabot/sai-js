import { DataFactory } from 'n3';
import { DatasetCore, NamedNode } from '@rdfjs/types';
import { getOneMatchingQuad } from 'interop-utils';
import { INTEROP } from 'interop-namespaces';
import { AccessReceipt, DataInstance, DataRegistration, InteropFactory } from '.';

export class DataGrant {
  iri: string;

  factory: InteropFactory;

  accessReceipt: AccessReceipt;

  inheritsFromGrant?: DataGrant;

  constructor(iri: string, accessReceipt: AccessReceipt, factory: InteropFactory) {
    this.iri = iri;
    this.factory = factory;
    this.accessReceipt = accessReceipt;
  }

  getDataInstanceIterator(): AsyncIterable<DataInstance> {
    let iterator: AsyncIterable<DataInstance>;
    if (this.scopeOfGrant.equals(INTEROP.AllInstances)) {
      const { factory, hasDataRegistrationIri } = this;
      iterator = {
        async *[Symbol.asyncIterator]() {
          const dataRegistration = await factory.dataRegistration(hasDataRegistrationIri);
          for (const instanceIri of dataRegistration.contains) {
            yield factory.dataInstance(instanceIri);
          }
        }
      };
    } else if (this.scopeOfGrant.equals(INTEROP.SelectedInstances)) {
      // we can't access the data registration :(
    }
    return iterator;
  }

  // TODO cache and remove getter
  get dataset(): DatasetCore {
    const quadPattern = [DataFactory.namedNode(this.iri), null, null, DataFactory.namedNode(this.accessReceipt.iri)];
    return this.accessReceipt.dataset.match(...quadPattern);
  }

  // TODO cache and remove getter
  get hasDataRegistrationIri(): string {
    const quadPattern = [
      DataFactory.namedNode(this.iri),
      INTEROP.hasDataRegistration,
      null,
      DataFactory.namedNode(this.accessReceipt.iri)
    ];
    return getOneMatchingQuad(this.dataset, ...quadPattern).object.value;
  }

  // TODO cache and remove getter
  get scopeOfGrant(): NamedNode {
    const quadPattern = [
      DataFactory.namedNode(this.iri),
      INTEROP.scopeOfGrant,
      null,
      DataFactory.namedNode(this.accessReceipt.iri)
    ];
    return getOneMatchingQuad(this.dataset, ...quadPattern).object as NamedNode;
  }

  // TODO cache and remove getter
  get inheritsFromGrantIri(): string | undefined {
    const quadPattern = [
      DataFactory.namedNode(this.iri),
      INTEROP.inheritsFromGrant,
      null,
      DataFactory.namedNode(this.accessReceipt.iri)
    ];
    return getOneMatchingQuad(this.dataset, ...quadPattern)?.object.value;
  }
}
