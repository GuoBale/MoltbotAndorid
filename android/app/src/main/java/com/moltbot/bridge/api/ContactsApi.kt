package com.moltbot.bridge.api

import android.Manifest
import android.content.ContentResolver
import android.content.Context
import android.provider.ContactsContract
import com.moltbot.bridge.protocol.ApiResponse
import kotlinx.serialization.json.*

class ContactsApi(context: Context) : BaseApi(context) {

    override suspend fun handleRequest(
        method: String,
        path: String,
        params: Map<String, String>,
        body: String?
    ): ApiResponse {
        // 检查权限
        requirePermission(Manifest.permission.READ_CONTACTS)?.let { return it }

        return when {
            method == "GET" && path.isEmpty() -> listContacts(params)
            method == "GET" && path.matches(Regex("^/\\d+$")) -> {
                val id = path.removePrefix("/")
                getContact(id)
            }
            else -> ApiResponse.notFound()
        }
    }

    private fun listContacts(params: Map<String, String>): ApiResponse {
        val query = params["q"]
        val limit = params["limit"]?.toIntOrNull() ?: 100
        val offset = params["offset"]?.toIntOrNull() ?: 0

        val contacts = mutableListOf<JsonObject>()
        val contentResolver = context.contentResolver

        val selection = if (!query.isNullOrBlank()) {
            "${ContactsContract.Contacts.DISPLAY_NAME_PRIMARY} LIKE ?"
        } else null

        val selectionArgs = if (!query.isNullOrBlank()) {
            arrayOf("%$query%")
        } else null

        val cursor = contentResolver.query(
            ContactsContract.Contacts.CONTENT_URI,
            arrayOf(
                ContactsContract.Contacts._ID,
                ContactsContract.Contacts.DISPLAY_NAME_PRIMARY,
                ContactsContract.Contacts.HAS_PHONE_NUMBER,
                ContactsContract.Contacts.PHOTO_URI
            ),
            selection,
            selectionArgs,
            "${ContactsContract.Contacts.DISPLAY_NAME_PRIMARY} ASC"
        )

        var total = 0
        cursor?.use {
            total = it.count
            var skipped = 0
            while (it.moveToNext()) {
                if (skipped < offset) {
                    skipped++
                    continue
                }
                if (contacts.size >= limit) break

                val id = it.getString(0)
                val name = it.getString(1) ?: ""
                val hasPhone = it.getInt(2) > 0
                val photoUri = it.getString(3)

                val phoneNumbers = if (hasPhone) {
                    getPhoneNumbers(contentResolver, id)
                } else emptyList()

                val emails = getEmails(contentResolver, id)

                contacts.add(buildJsonObject {
                    put("id", id)
                    put("displayName", name)
                    put("phoneNumbers", JsonArray(phoneNumbers.map { phone ->
                        buildJsonObject {
                            put("number", phone.first)
                            put("type", phone.second)
                        }
                    }))
                    put("emails", JsonArray(emails.map { email ->
                        buildJsonObject {
                            put("address", email.first)
                            put("type", email.second)
                        }
                    }))
                    photoUri?.let { put("photoUri", it) }
                })
            }
        }

        val data = buildJsonObject {
            put("contacts", JsonArray(contacts))
            put("total", total)
            put("limit", limit)
            put("offset", offset)
            put("hasMore", offset + contacts.size < total)
        }
        return success(data)
    }

    private fun getContact(id: String): ApiResponse {
        val contentResolver = context.contentResolver

        val cursor = contentResolver.query(
            ContactsContract.Contacts.CONTENT_URI,
            arrayOf(
                ContactsContract.Contacts._ID,
                ContactsContract.Contacts.DISPLAY_NAME_PRIMARY,
                ContactsContract.Contacts.HAS_PHONE_NUMBER,
                ContactsContract.Contacts.PHOTO_URI
            ),
            "${ContactsContract.Contacts._ID} = ?",
            arrayOf(id),
            null
        )

        cursor?.use {
            if (it.moveToFirst()) {
                val name = it.getString(1) ?: ""
                val hasPhone = it.getInt(2) > 0
                val photoUri = it.getString(3)

                val phoneNumbers = if (hasPhone) {
                    getPhoneNumbers(contentResolver, id)
                } else emptyList()

                val emails = getEmails(contentResolver, id)
                val addresses = getAddresses(contentResolver, id)
                val organization = getOrganization(contentResolver, id)
                val note = getNote(contentResolver, id)

                val data = buildJsonObject {
                    put("id", id)
                    put("displayName", name)
                    put("phoneNumbers", JsonArray(phoneNumbers.map { phone ->
                        buildJsonObject {
                            put("number", phone.first)
                            put("type", phone.second)
                        }
                    }))
                    put("emails", JsonArray(emails.map { email ->
                        buildJsonObject {
                            put("address", email.first)
                            put("type", email.second)
                        }
                    }))
                    put("addresses", JsonArray(addresses.map { addr ->
                        buildJsonObject {
                            put("formatted", addr.first)
                            put("type", addr.second)
                        }
                    }))
                    organization?.let { org ->
                        put("organization", buildJsonObject {
                            put("company", org.first)
                            put("title", org.second)
                        })
                    }
                    note?.let { put("note", it) }
                    photoUri?.let { put("photoUri", it) }
                }
                return success(data)
            }
        }

        return ApiResponse.notFound("Contact not found")
    }

    private fun getPhoneNumbers(contentResolver: ContentResolver, contactId: String): List<Pair<String, String>> {
        val phones = mutableListOf<Pair<String, String>>()
        val cursor = contentResolver.query(
            ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
            arrayOf(
                ContactsContract.CommonDataKinds.Phone.NUMBER,
                ContactsContract.CommonDataKinds.Phone.TYPE
            ),
            "${ContactsContract.CommonDataKinds.Phone.CONTACT_ID} = ?",
            arrayOf(contactId),
            null
        )
        cursor?.use {
            while (it.moveToNext()) {
                val number = it.getString(0) ?: continue
                val type = when (it.getInt(1)) {
                    ContactsContract.CommonDataKinds.Phone.TYPE_MOBILE -> "mobile"
                    ContactsContract.CommonDataKinds.Phone.TYPE_HOME -> "home"
                    ContactsContract.CommonDataKinds.Phone.TYPE_WORK -> "work"
                    else -> "other"
                }
                phones.add(number to type)
            }
        }
        return phones
    }

    private fun getEmails(contentResolver: ContentResolver, contactId: String): List<Pair<String, String>> {
        val emails = mutableListOf<Pair<String, String>>()
        val cursor = contentResolver.query(
            ContactsContract.CommonDataKinds.Email.CONTENT_URI,
            arrayOf(
                ContactsContract.CommonDataKinds.Email.ADDRESS,
                ContactsContract.CommonDataKinds.Email.TYPE
            ),
            "${ContactsContract.CommonDataKinds.Email.CONTACT_ID} = ?",
            arrayOf(contactId),
            null
        )
        cursor?.use {
            while (it.moveToNext()) {
                val address = it.getString(0) ?: continue
                val type = when (it.getInt(1)) {
                    ContactsContract.CommonDataKinds.Email.TYPE_HOME -> "home"
                    ContactsContract.CommonDataKinds.Email.TYPE_WORK -> "work"
                    else -> "other"
                }
                emails.add(address to type)
            }
        }
        return emails
    }

    private fun getAddresses(contentResolver: ContentResolver, contactId: String): List<Pair<String, String>> {
        val addresses = mutableListOf<Pair<String, String>>()
        val cursor = contentResolver.query(
            ContactsContract.CommonDataKinds.StructuredPostal.CONTENT_URI,
            arrayOf(
                ContactsContract.CommonDataKinds.StructuredPostal.FORMATTED_ADDRESS,
                ContactsContract.CommonDataKinds.StructuredPostal.TYPE
            ),
            "${ContactsContract.CommonDataKinds.StructuredPostal.CONTACT_ID} = ?",
            arrayOf(contactId),
            null
        )
        cursor?.use {
            while (it.moveToNext()) {
                val address = it.getString(0) ?: continue
                val type = when (it.getInt(1)) {
                    ContactsContract.CommonDataKinds.StructuredPostal.TYPE_HOME -> "home"
                    ContactsContract.CommonDataKinds.StructuredPostal.TYPE_WORK -> "work"
                    else -> "other"
                }
                addresses.add(address to type)
            }
        }
        return addresses
    }

    private fun getOrganization(contentResolver: ContentResolver, contactId: String): Pair<String, String>? {
        val cursor = contentResolver.query(
            ContactsContract.Data.CONTENT_URI,
            arrayOf(
                ContactsContract.CommonDataKinds.Organization.COMPANY,
                ContactsContract.CommonDataKinds.Organization.TITLE
            ),
            "${ContactsContract.Data.CONTACT_ID} = ? AND ${ContactsContract.Data.MIMETYPE} = ?",
            arrayOf(contactId, ContactsContract.CommonDataKinds.Organization.CONTENT_ITEM_TYPE),
            null
        )
        cursor?.use {
            if (it.moveToFirst()) {
                val company = it.getString(0) ?: ""
                val title = it.getString(1) ?: ""
                if (company.isNotEmpty() || title.isNotEmpty()) {
                    return company to title
                }
            }
        }
        return null
    }

    private fun getNote(contentResolver: ContentResolver, contactId: String): String? {
        val cursor = contentResolver.query(
            ContactsContract.Data.CONTENT_URI,
            arrayOf(ContactsContract.CommonDataKinds.Note.NOTE),
            "${ContactsContract.Data.CONTACT_ID} = ? AND ${ContactsContract.Data.MIMETYPE} = ?",
            arrayOf(contactId, ContactsContract.CommonDataKinds.Note.CONTENT_ITEM_TYPE),
            null
        )
        cursor?.use {
            if (it.moveToFirst()) {
                return it.getString(0)
            }
        }
        return null
    }
}
