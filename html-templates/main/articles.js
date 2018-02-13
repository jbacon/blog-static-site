import { importHtml } from '/js-modules/myUtilities.js'
import { CommentSection } from '/html-templates/general/comment.js'

export { loadArticle }
async function loadArticle(year, month, day, articleName) {
	const linkImport = await importHtml('/html-templates/main/articles/'+year+'/'+month+'/'+day+'/'+articleName+'.html')
	const articleHeaderOld = document.getElementById('article-header')
	const articleDateOld = document.getElementById('article-date')
	const articleSectionOld = document.getElementById('article-section')
	// const articleFooterOld = document.getElementById('article-footer')
	const articleHeaderNew = articleHeaderOld.cloneNode(false)
	articleHeaderNew.textContent= articleName.replace(/[^a-zA-Z0-9]/g, ' ').toUpperCase()
	articleHeaderOld.replaceWith(articleHeaderNew)
	const articleDateNew = articleDateOld.cloneNode(false)
	articleDateNew.textContent = month+' '+day+', '+year
	articleDateOld.replaceWith(articleDateNew)
	const newArticleSection = articleSectionOld.cloneNode(false) // Clone but without the children...
	newArticleSection.appendChild(document.importNode(linkImport.querySelector('template').content, true))
	articleSectionOld.replaceWith(newArticleSection)
	await importHtml('/html-templates/general/comment.html')
	new CommentSection({ entity: '/articles/'+year+'/'+month+'/'+day+'/'+articleName+'.html' })
}