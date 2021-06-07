/**
 @license
 (C) Copyright Nuxeo Corp. (http://nuxeo.com/)

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

// extended and created by NEOM
import '@polymer/polymer/polymer-legacy.js';

import '@polymer/iron-icon/iron-icon.js';
import '@polymer/paper-slider/paper-slider.js';
import '@nuxeo/nuxeo-ui-elements/widgets/nuxeo-card.js';
import '@nuxeo/nuxeo-ui-elements/nuxeo-path-suggestion/nuxeo-path-suggestion.js';
import '@nuxeo/nuxeo-ui-elements/dataviz/nuxeo-document-distribution-chart.js';
import { Polymer } from '@polymer/polymer/lib/legacy/polymer-fn.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';
import { I18nBehavior } from '@nuxeo/nuxeo-ui-elements/nuxeo-i18n-behavior.js';

import '@nuxeo/nuxeo-elements/nuxeo-operation.js';
import '@nuxeo/nuxeo-ui-elements/nuxeo-data-table/iron-data-table.js';
// import { LIST } from './lists.data';

/**
 `neom-reports`
 @element neom-reports
 */
Polymer({
  _template: html`
    <!--TODO: Translations-->
    <style include="iron-flex">
      :host {
        display: block;
      }

      .suggestion-wrapper {
        border-radius: 2px;
        border: 1px solid var(--nuxeo-border);
        padding: 0 8px;
      }

      .suggestion-wrapper iron-icon {
        color: var(--dark-primary-color);
        margin-right: 8px;
      }

      paper-slider {
        width: 100%;
      }

      nuxeo-path-suggestion {
        --nuxeo-path-suggestion-results: {
          z-index: 2;
        }
        --paper-input-container-underline: {
          display: none;
        }
        --paper-input-container-underline-focus: {
          display: none;
        }
      }
    </style>

    <template is="dom-if" if="[[visible]]">
      <iron-ajax auto url="{{resolveUrl}}" handle-as="json" on-response="onResponse" id="xhr"></iron-ajax>

      <div class="flex-layout">
        <nuxeo-card>
          <nuxeo-data-table items="{{getData()}}" label="SIMPLE REPORT">
            <nuxeo-data-table-column name="Company">
              <template>
                [[item.properties.company_name]]
              </template>
            </nuxeo-data-table-column>

            <nuxeo-data-table-column name="Date">
              <template>
                <nuxeo-date datetime="[[item.properties.date]]"></nuxeo-date>
              </template>
            </nuxeo-data-table-column>

            <nuxeo-data-table-column name="Department">
              <template>
                [[item.properties.department]]
              </template>
            </nuxeo-data-table-column>

            <nuxeo-data-table-column name="City">
              <template>
                [[item.properties.city]]
              </template>
            </nuxeo-data-table-column>

            <nuxeo-data-table-column name="User">
              <template>
                <nuxeo-user-tag user="[[item.properties.user]]" disabled></nuxeo-user-tag>
              </template>
            </nuxeo-data-table-column>
          </nuxeo-data-table>
        </nuxeo-card>
      </div>
    </template>
  `,

  is: 'neom-reports',
  behaviors: [I18nBehavior],
  url: 'http://0.0.0.0:5000/nuxeo/api/v1/automation/Directory.ReportEntries',

  properties: {
    visible: {
      type: Boolean,
      value: false,
    },
    reports: {
      type: Array,
      value: [],
    },
    resolveUrl: {
      type: String,
    },
  },

  observers: [],

  ready() {
    this.getData();
  },

  getData() {
    // return LIST(10).data;
    // this.$.reports
    //       .get()
    //       .then((response) => {
    //         console.log('get API response = ', response);
    //         // this.folderTypes = response.entries;
    //         // const assetFolderType = this.folderTypes.find((folderType) => folderType.id === 'asset');
    //         // if (assetFolderType) this.$.folderTypeSelector.set('selected', assetFolderType.id);
    //       })
    //       .catch((e) => {
    //         console.error(e);
    //       });

    // this.$.folderTypes
    //       .get()
    //       .then((response) => {
    //         console.log('got it = ', response)
    //       })
    //       .catch((e) => {
    //         console.error(e);
    //       });
    this.set('resolveUrl', this.url);
  },

  onResponse(response) {
    return response;
  },
});
